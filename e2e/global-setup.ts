import { clerkSetup } from "@clerk/testing/playwright";

export default async function globalSetup() {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey?.startsWith("pk_test_")) {
    throw new Error(
      "E2E: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_...) が未設定です。secrets を読み込んでから pnpm test:e2e を実行してください。"
    );
  }
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error(
      "E2E: CLERK_SECRET_KEY (sk_test_...) が未設定です。secrets を読み込んでから pnpm test:e2e を実行してください。"
    );
  }

  await clerkSetup();
}
