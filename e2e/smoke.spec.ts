import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

/**
 * 認証なしで壊れないことを守る最小スモーク。
 * Clerk Testing Token で development instance の dev-browser 要件を満たす。
 * ログイン後フローは別スペックで追加する（notes/testing-discipline.md）。
 */
test.describe("認証ゲート スモーク", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test("未ログインで /sign-in に到達できる", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator("body")).toBeVisible();
    const clerkRoot = page.locator(
      ".cl-rootBox, .cl-signIn-root, [data-clerk-component]"
    );
    await expect(clerkRoot.first()).toBeVisible({ timeout: 15_000 });
  });

  test("保護ルートは未ログインだと sign-in へ誘導される", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/, { timeout: 15_000 });
  });
});
