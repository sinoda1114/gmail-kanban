"use server";

import { auth } from "@clerk/nextjs/server";
import {
  GMAIL_READONLY_SCOPE,
  getGoogleOAuthStatus,
} from "@/lib/clerk-google-oauth";
import { isGmailWebSyncId, parseGmailInput } from "@/lib/gmail-url";
import {
  formatGmailThreadText,
  type GmailMessageResource,
  type GmailThreadResource,
} from "@/lib/gmail-message";

export type FetchGmailResult =
  | { success: true; text: string; gmailUrl: string; threadId: string }
  | { success: false; error: string };

const GMAIL_API_ORIGIN = "https://gmail.googleapis.com";
const GMAIL_API_BASE = `${GMAIL_API_ORIGIN}/gmail/v1/`;

/** Gmail API path segment として安全な ID のみ許可（SSRF / パス注入防止） */
const GMAIL_API_ID_PATTERN = /^[A-Za-z0-9_:-]{1,256}$/;

function isSafeGmailApiId(id: string): boolean {
  return GMAIL_API_ID_PATTERN.test(id);
}

function gmailApiUrl(path: string): string {
  const url = new URL(path, GMAIL_API_BASE);
  if (url.origin !== GMAIL_API_ORIGIN) {
    throw new Error("Invalid Gmail API path");
  }
  return url.href;
}

function scopeErrorMessage(): string {
  return `Gmail の読み取り権限がありません。Clerk の Google OAuth に ${GMAIL_READONLY_SCOPE} スコープを追加し、Google アカウントを再連携してください。`;
}

function authErrorForStatus(status: number): string | null {
  if (status === 401) {
    return "Google 認証が無効です。一度ログアウトして Google で再ログインしてください";
  }
  if (status === 403) {
    return scopeErrorMessage();
  }
  return null;
}

function buildGmailUrl(threadId: string): string {
  return `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
}

async function gmailGetJson<T>(
  accessToken: string,
  path: string
): Promise<
  { ok: true; data: T } | { ok: false; status: number; error: string }
> {
  let url: string;
  try {
    url = gmailApiUrl(path);
  } catch {
    return { ok: false, status: 400, error: "無効な Gmail ID です" };
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const authError = authErrorForStatus(res.status);
    return {
      ok: false,
      status: res.status,
      error: authError ?? `Gmail API エラー（HTTP ${res.status}）`,
    };
  }
  return { ok: true, data: (await res.json()) as T };
}

async function fetchAsThread(
  accessToken: string,
  id: string
): Promise<
  | { success: true; thread: GmailThreadResource }
  | { success: false; status: number; error: string }
> {
  if (!isSafeGmailApiId(id)) {
    return { success: false, status: 400, error: "無効な Gmail ID です" };
  }

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
  if (!isSafeGmailApiId(id)) {
    return { success: false, status: 400, error: "無効な Gmail ID です" };
  }

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
  if (!isSafeGmailApiId(threadId)) {
    return {
      success: true,
      messages: [asMessage.data],
      threadId: id,
    };
  }

  const threadResult = await fetchAsThread(accessToken, threadId);
  if (threadResult.success) {
    const messages = threadResult.thread.messages ?? [asMessage.data];
    return { success: true, messages, threadId };
  }

  const threadAuthError = authErrorForStatus(threadResult.status);
  if (threadAuthError) {
    return {
      success: false,
      status: threadResult.status,
      error: threadAuthError,
    };
  }

  return {
    success: true,
    messages: [asMessage.data],
    threadId,
  };
}

function resolveFetchFailure(
  status: number,
  error: string
): FetchGmailResult {
  const authError = authErrorForStatus(status);
  if (authError) {
    return { success: false, error: authError };
  }
  if (error && error !== `Gmail API エラー（HTTP ${status}）`) {
    return { success: false, error };
  }
  return {
    success: false,
    error:
      "Gmail からメールを取得できませんでした。URL・ID が正しいか、自分の受信箱のメールか確認してください",
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

  if (!isSafeGmailApiId(parsed.id)) {
    return { success: false, error: "無効な Gmail ID です" };
  }

  const googleStatus = await getGoogleOAuthStatus(clerkUserId);
  if (!googleStatus.connected) {
    return { success: false, error: googleStatus.message };
  }
  const accessToken = googleStatus.accessToken;

  const threadResult = await fetchAsThread(accessToken, parsed.id);
  let messages: GmailMessageResource[];
  let threadId: string;

  if (threadResult.success) {
    messages = threadResult.thread.messages ?? [];
    threadId = threadResult.thread.id ?? parsed.id;
  } else {
    const threadAuthError = authErrorForStatus(threadResult.status);
    if (threadAuthError) {
      return { success: false, error: threadAuthError };
    }

    const messageResult = await fetchAsMessage(accessToken, parsed.id);
    if (!messageResult.success) {
      return resolveFetchFailure(messageResult.status, messageResult.error);
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
    gmailUrl: buildGmailUrl(threadId),
    threadId,
  };
}
