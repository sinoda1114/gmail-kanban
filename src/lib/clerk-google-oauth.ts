import { clerkClient } from "@clerk/nextjs/server";

export type GoogleOAuthStatus =
  | { connected: true; accessToken: string }
  | { connected: false; reason: "no_token" | "error"; message: string };

export async function getGoogleOAuthStatus(
  clerkUserId: string
): Promise<GoogleOAuthStatus> {
  try {
    const client = await clerkClient();
    const tokenResponse = await client.users.getUserOauthAccessToken(
      clerkUserId,
      "oauth_google"
    );
    const accessToken = tokenResponse.data[0]?.token;
    if (!accessToken) {
      return {
        connected: false,
        reason: "no_token",
        message: "Google アカウントが連携されていません",
      };
    }
    return { connected: true, accessToken };
  } catch {
    return {
      connected: false,
      reason: "error",
      message: "Google アカウント連携の確認中にエラーが発生しました",
    };
  }
}
