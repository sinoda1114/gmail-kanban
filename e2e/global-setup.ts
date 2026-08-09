import { clerkSetup } from "@clerk/testing/playwright";

export default async function globalSetup() {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey?.startsWith("pk_")) {
    throw new Error(
      "E2E: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_...) が未設定です。secrets を読み込んでから pnpm test:e2e を実行してください。"
    );
  }
  if (!secretKey?.startsWith("sk_")) {
    throw new Error(
      "E2E: CLERK_SECRET_KEY (sk_...) が未設定です。secrets を読み込んでから pnpm test:e2e を実行してください。"
    );
  }

  await clerkSetup();
}
