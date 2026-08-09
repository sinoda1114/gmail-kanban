import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

const DEFAULT_E2E_USER_JSON = join(
  homedir(),
  ".config/gmail-kanban-secrets/e2e-user.json"
);

/** development instance の dev-browser 回避（既存 smoke と同じ）。 */
export async function prepareClerkTestingPage(page: Page) {
  await setupClerkTestingToken({ page });
}

/**
 * Clerk E2E 用テストユーザーのメール。
 * 優先: E2E_CLERK_USER_EMAIL → E2E_USER_JSON_PATH（既定は Cloud secrets）の JSON.email
 */
export function resolveE2eClerkUserEmail(): string | undefined {
  const fromEnv = process.env.E2E_CLERK_USER_EMAIL?.trim();
  if (fromEnv) return fromEnv;

  const jsonPath =
    process.env.E2E_USER_JSON_PATH?.trim() || DEFAULT_E2E_USER_JSON;
  try {
    const raw = readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(raw) as { email?: string };
    const email = parsed.email?.trim();
    return email || undefined;
  } catch {
    return undefined;
  }
}

/** Testing Token + ticket ベースのサーバー側サインイン（UI 入力は使わない）。 */
export async function signInE2eTestUser(page: Page, emailAddress: string) {
  // `/` は RSC リダイレクトのみで Clerk JS が載らないため sign-in へ直接行く
  await page.goto("/sign-in");
  await clerk.signIn({ page, emailAddress });
}
