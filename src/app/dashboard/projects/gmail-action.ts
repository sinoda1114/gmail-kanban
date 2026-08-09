"use server";

import { auth } from "@clerk/nextjs/server";
import {
  GMAIL_READONLY_SCOPE,
  getGoogleAccessToken,
} from "@/lib/google-oauth";
import { isGmailWebSyncId, parseGmailInput } from "@/lib/gmail-url";
import {
  formatGmailThreadText,
  type GmailMessageResource,
  type GmailThreadResource,
} from "@/lib/gmail-message";

export type FetchGmailResult =
  | { success: true; text: string; gmailUrl: string; threadId: string }
  | { success: false; error: string };

async function gmailGetJson<T>(
  accessToken: string,
  path: string
): Promise<
  { ok: true; data: T } | { ok: false; status: number; error: string }
> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: `Gmail API エラー（HTTP ${res.status}）`,
    };
  }
  return { ok: true, data: (await res.json()) as T };
}

function scopeErrorMessage(): string {
  return `Gmail の読み取り権限がありません。Clerk の Google OAuth に ${GMAIL_READONLY_SCOPE} スコープを追加し、Google アカウントを再連携してください。`;
}

function buildGmailUrl(threadId: string, inputUrl?: string): string {
  if (inputUrl?.startsWith("http")) return inputUrl;
  return `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
}

async function fetchAsThread(
  accessToken: string,
  id: string
): Promise<
  | { success: true; thread: GmailThreadResource }
  | { success: false; status: number; error: string }
> {
  const asThread = await gmailGetJson<GmailThreadResource>(
    accessToken,
    `users/me/threads/${encodeURIComponent(id)}?format=full`
  );
  if (asThread.ok) {
    return { success: true, thread: asThread.data };
  }
  return {
    success: false,
    status: asThread.status,
    error: asThread.error,
  };
}

async function fetchAsMessage(
  accessToken: string,
  id: string
): Promise<
  | { success: true; messages: GmailMessageResource[]; threadId: string }
  | { success: false; status: number; error: string }
> {
  const asMessage = await gmailGetJson<GmailMessageResource>(
    accessToken,
    `users/me/messages/${encodeURIComponent(id)}?format=full`
  );
  if (!asMessage.ok) {
    return {
      success: false,
      status: asMessage.status,
      error: asMessage.error,
    };
  }

  const threadId = asMessage.data.threadId ?? id;
  const threadResult = await fetchAsThread(accessToken, threadId);
  if (threadResult.success) {
    const messages = threadResult.thread.messages ?? [asMessage.data];
    return { success: true, messages, threadId };
  }

  return {
    success: true,
    messages: [asMessage.data],
    threadId,
  };
}

export async function fetchGmailThread(
  input: string
): Promise<FetchGmailResult> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, error: "ログインが必要です" };

  const parsed = parseGmailInput(input);
  if (!parsed) {
    return {
      success: false,
      error:
        "Gmail の URL またはスレッド ID を入力してください（mail.google.com のメール個別 URL）",
    };
  }

  if (isGmailWebSyncId(parsed.id)) {
    return {
      success: false,
      error:
        "この URL 形式（FMfcgz で始まる ID）は Gmail API で開けません。英数字の古い形式の URL、スレッド ID を使うか、本文を直接貼ってください",
    };
  }

  const { token, error: tokenError } = await getGoogleAccessToken(clerkUserId);
  if (!token) {
    return {
      success: false,
      error: tokenError ?? "Google アカウント連携が必要です",
    };
  }

  const threadResult = await fetchAsThread(token, parsed.id);
  let messages: GmailMessageResource[];
  let threadId: string;

  if (threadResult.success) {
    messages = threadResult.thread.messages ?? [];
    threadId = threadResult.thread.id ?? parsed.id;
  } else {
    const messageResult = await fetchAsMessage(token, parsed.id);
    if (!messageResult.success) {
      const status = messageResult.status;
      if (status === 401) {
        return {
          success: false,
          error:
            "Google 認証が無効です。一度ログアウトして Google で再ログインしてください",
        };
      }
      if (status === 403) {
        return { success: false, error: scopeErrorMessage() };
      }
      return {
        success: false,
        error:
          "Gmail からメールを取得できませんでした。URL・ID が正しいか、自分の受信箱のメールか確認してください",
      };
    }
    messages = messageResult.messages;
    threadId = messageResult.threadId;
  }

  if (messages.length === 0) {
    return { success: false, error: "スレッドにメッセージがありません" };
  }

  const text = formatGmailThreadText(messages);
  if (!text) {
    return { success: false, error: "メール本文が空でした" };
  }

  return {
    success: true,
    text,
    gmailUrl: buildGmailUrl(threadId, parsed.gmailUrl),
    threadId,
  };
}
