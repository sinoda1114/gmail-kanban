import { test, expect } from "@playwright/test";
import {
  prepareClerkTestingPage,
  resolveE2eClerkUserEmail,
  signInE2eTestUser,
} from "./helpers/clerk";

const e2eUserEmail = resolveE2eClerkUserEmail();

/**
 * 認証後の最小スモーク: sign-in → /dashboard（カンバンシェル表示）。
 * Clerk Testing Token + clerk.signIn（ticket）を使う（notes/testing-discipline.md）。
 */
test.describe("認証済み スモーク", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await prepareClerkTestingPage(page);
  });

  test("サインイン後にダッシュボードのカンバンシェルが表示される", async ({
    page,
  }) => {
    test.skip(
      !e2eUserEmail,
      "E2E_CLERK_USER_EMAIL または ~/.config/gmail-kanban-secrets/e2e-user.json が未設定です。"
    );

    await signInE2eTestUser(page, e2eUserEmail!);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "案件カンバン" })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("link", { name: "ダッシュボードへ移動" })
    ).toBeVisible();
    await expect(page.locator(".cl-userButton-root").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
