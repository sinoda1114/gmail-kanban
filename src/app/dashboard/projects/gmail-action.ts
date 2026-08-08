"use server";

import { auth } from "@clerk/nextjs/server";
import { parseGmailUrlId } from "@/lib/gmail-url";
import { getGoogleAccessTokenForGmail } from "@/lib/google-access-token";
import {
  extractTextFromGmailMessage,
  formatFetchedMail,
  type GmailMessageResource,
} from "@/lib/gmail-message";

export type FetchGmailResult =
  | { success: true; text: string; messageId: string }
  | { success: false; error: string };

type GmailThreadResource = {
  id?: string;
  messages?: GmailMessageResource[];
};

async function gmailGetJson<T>(
  accessToken: string,
  path: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? "";
    } catch {
      detail = "";
    }
    return {
      ok: false,
      status: res.status,
      error: detail || `Gmail API error (${res.status})`,
    };
  }
  return { ok: true, data: (await res.json()) as T };
}

async function resolveMessage(
  accessToken: string,
  id: string
): Promise<
  | { success: true; message: GmailMessageResource }
  | { success: false; error: string }
> {
  // 1) message id として取得
  const asMessage = await gmailGetJson<GmailMessageResource>(
    accessToken,
    `users/me/messages/${encodeURIComponent(id)}?format=full`
  );
  if (asMessage.ok) {
    return { success: true, message: asMessage.data };
  }

  // 2) thread id として取得し、最新メッセージを使う
  const asThread = await gmailGetJson<GmailThreadResource>(
    accessToken,
    `users/me/threads/${encodeURIComponent(id)}?format=full`
  );
  if (asThread.ok) {
    const messages = asThread.data.messages ?? [];
    const latest = messages[messages.length - 1];
    if (!latest) {
      return { success: false, error: "スレッドにメッセージがありません" };
    }
    return { success: true, message: latest };
  }

  if (asMessage.status === 401 || asThread.status === 401) {
    return {
      success: false,
      error:
        "Google 認証が無効です。サインアウトして Google で再ログインしてください",
    };
  }

  if (asMessage.status === 403 || asThread.status === 403) {
    return {
      success: false,
      error:
        "Gmail 読み取り権限がありません。GOOGLE_REFRESH_TOKEN に gmail.readonly 付きのトークンを設定してください",
    };
  }

  return {
    success: false,
    error:
      "Gmail からメールを取得できませんでした。URL が正しいか、自分の受信箱のメールか確認してください",
  };
}

export async function fetchGmailBodyFromUrl(
  gmailUrl: string
): Promise<FetchGmailResult> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, error: "Unauthorized" };

  const id = parseGmailUrlId(gmailUrl);
  if (!id) {
    return {
      success: false,
      error:
        "Gmail URL を認識できません。mail.google.com のメール個別URLを貼ってください",
    };
  }

  const { token, error: tokenError } =
    await getGoogleAccessTokenForGmail(clerkUserId);
  if (!token) {
    return { success: false, error: tokenError ?? "Google 連携が必要です" };
  }

  const resolved = await resolveMessage(token, id);
  if (!resolved.success) {
    return { success: false, error: resolved.error };
  }

  const extracted = extractTextFromGmailMessage(resolved.message);
  const text = formatFetchedMail(extracted);
  if (!text) {
    return { success: false, error: "メール本文が空でした" };
  }

  return {
    success: true,
    text,
    messageId: resolved.message.id ?? id,
  };
}
