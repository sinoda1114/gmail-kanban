#!/usr/bin/env node
/**
 * Gmail API 用 refresh token を CLI で取得する（Dashboard 操作不要）。
 *
 * 前提: OAuth クライアント（Desktop または TV/Limited Input）の
 *       GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET が環境にあること。
 * 必要スコープ: https://www.googleapis.com/auth/gmail.readonly
 *
 * 使い方:
 *   export GOOGLE_CLIENT_ID=...
 *   export GOOGLE_CLIENT_SECRET=...
 *   node scripts/get-gmail-refresh-token.mjs
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET を export してから実行してください"
  );
  process.exit(1);
}

async function main() {
  const deviceRes = await fetch("https://oauth2.googleapis.com/device/code", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: SCOPE,
    }),
  });
  if (!deviceRes.ok) {
    const text = await deviceRes.text();
    console.error("device code 取得失敗:", deviceRes.status, text);
    console.error(
      "ヒント: OAuth クライアント種別が Desktop / TV and Limited Input である必要があります"
    );
    process.exit(1);
  }

  const device = /** @type {{
    device_code: string;
    user_code: string;
    verification_url?: string;
    verification_uri?: string;
    interval?: number;
    expires_in?: number;
  }} */ (await deviceRes.json());

  const verifyUrl =
    device.verification_url ||
    device.verification_uri ||
    "https://www.google.com/device";
  console.log("");
  console.log("1) ブラウザで開く:", verifyUrl);
  console.log("2) コードを入力:", device.user_code);
  console.log("3) Gmail 読み取りを許可する");
  console.log("");
  console.log("承認待ち…");

  const intervalMs = Math.max(5, device.interval ?? 5) * 1000;
  const deadline = Date.now() + (device.expires_in ?? 1800) * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        device_code: device.device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    const json = /** @type {{
      error?: string;
      access_token?: string;
      refresh_token?: string;
    }} */ (await tokenRes.json());

    if (json.error === "authorization_pending") continue;
    if (json.error === "slow_down") {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    if (json.error) {
      console.error("トークン取得失敗:", json.error);
      process.exit(1);
    }
    if (!json.refresh_token) {
      console.error(
        "refresh_token が返りませんでした。初回同意・prompt=consent 相当が必要です"
      );
      process.exit(1);
    }

    console.log("");
    console.log("成功。次を secrets / .env.gmail に設定してください:");
    console.log("GOOGLE_CLIENT_ID=<既存の値>");
    console.log("GOOGLE_CLIENT_SECRET=<既存の値>");
    console.log(`GOOGLE_REFRESH_TOKEN=${json.refresh_token}`);
    return;
  }

  console.error("タイムアウト: 承認が完了しませんでした");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
