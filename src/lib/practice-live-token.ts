import {
  buildLiveConnectSetup,
  liveAuthTokenPayload,
  parseLiveAuthTokenResponse,
  type LiveConnectSetup,
} from "@/lib/practice-live";

const AUTH_TOKENS_URL =
  "https://generativelanguage.googleapis.com/v1beta/auth_tokens";

export async function mintLiveEphemeralToken(
  setup: LiveConnectSetup
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }
  const now = Date.now();
  const response = await fetch(AUTH_TOKENS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      ...liveAuthTokenPayload(setup),
      expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
    }),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`auth_tokens ${response.status}`);
  }
  const parsed = parseLiveAuthTokenResponse(json);
  if (!parsed) {
    throw new Error("auth_tokens missing name");
  }
  return parsed.name;
}

export function liveSetupFromInstruction(instruction: string): LiveConnectSetup {
  return buildLiveConnectSetup(instruction);
}
