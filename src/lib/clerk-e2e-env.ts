const PUBLISHABLE_ENV_NAMES = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_PUBLISHABLE_KEY",
] as const;

/** Playwright E2E は Clerk Development キーのみ。live キーは拒否する。 */
export function assertClerkE2eEnv(
  env: Record<string, string | undefined> = process.env
): void {
  const publishableKey =
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? env.CLERK_PUBLISHABLE_KEY;
  const secretKey = env.CLERK_SECRET_KEY;

  if (!publishableKey?.startsWith("pk_test_")) {
    throw new Error(
      `E2E: Clerk Development の publishable key (pk_test_...) が必要です。次のいずれかを設定してください: ${PUBLISHABLE_ENV_NAMES.join(", ")}。pk_live_ は使えません。`
    );
  }
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error(
      "E2E: CLERK_SECRET_KEY は Development の sk_test_... である必要があります。sk_live_ は使えません。"
    );
  }
}
