import { clerkClient } from "@clerk/nextjs/server";

type GoogleTokenResult = { token?: string; error?: string };

/**
 * Clerk 経由で Google OAuth アクセストークンを取得する。
 * Calendar / Gmail など Google API 呼び出しで共通利用。
 */
export async function getGoogleAccessToken(
  clerkUserId: string
): Promise<GoogleTokenResult> {
  try {
    const client = await clerkClient();
    const tokenResponse = await client.users.getUserOauthAccessToken(
      clerkUserId,
      "oauth_google"
    );
    const token = tokenResponse.data[0]?.token;
    if (!token) {
      return {
        error: "Google アカウントが連携されていません",
      };
    }
    return { token };
  } catch {
    return {
      error: "Google アカウント連携の確認中にエラーが発生しました",
    };
  }
}

export const GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";
