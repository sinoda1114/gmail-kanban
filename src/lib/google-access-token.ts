/**
 * Gmail API 用 access token の取得。
 * 優先: 環境変数の refresh token（Clerk Dashboard 不要）
 * 次点: Clerk の oauth_google
 */

type TokenResult = { token?: string; error?: string };

async function tokenFromRefreshEnv(): Promise<TokenResult | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      error:
        "GOOGLE_REFRESH_TOKEN の更新に失敗しました。Client ID/Secret/Refresh token を確認してください",
    };
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    return { error: "Google access token が取得できませんでした" };
  }
  return { token: json.access_token };
}

async function tokenFromClerk(clerkUserId: string): Promise<TokenResult> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const tokenResponse = await client.users.getUserOauthAccessToken(
      clerkUserId,
      "oauth_google"
    );
    const token = tokenResponse.data[0]?.token;
    if (!token) {
      return {
        error:
          "Google 資格情報がありません。GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN を設定するか、Google ログインしてください",
      };
    }
    return { token };
  } catch {
    return {
      error: "Google アカウント連携の確認中にエラーが発生しました",
    };
  }
}

export async function getGoogleAccessTokenForGmail(
  clerkUserId: string
): Promise<TokenResult> {
  const fromEnv = await tokenFromRefreshEnv();
  if (fromEnv) {
    if (fromEnv.token) return fromEnv;
    // env が揃っているのに失敗 → Clerk にフォールバックせず原因を返す
    return fromEnv;
  }
  return tokenFromClerk(clerkUserId);
}
