import { test, expect } from "@playwright/test";
import {
  prepareClerkTestingPage,
  resolveE2eClerkUserEmail,
  signInE2eTestUser,
} from "./helpers/clerk";

const e2eUserEmail = resolveE2eClerkUserEmail();

test.describe("プラン画面", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await prepareClerkTestingPage(page);
  });

  test("サインイン後にヘッダーからプラン画面が開ける", async ({ page }) => {
    if (!e2eUserEmail) {
      test.skip(
        true,
        "E2E_CLERK_USER_EMAIL または ~/.config/gmail-kanban-secrets/e2e-user.json が未設定です。"
      );
      return;
    }

    await signInE2eTestUser(page, e2eUserEmail);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "案件カンバン" })
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "プラン" }).click();
    await expect(page).toHaveURL(/\/dashboard\/billing/);
    await expect(page.getByRole("heading", { name: "プラン" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "現在のプラン" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "アップグレード" })
    ).toBeVisible();
    await expect(page.getByText("案件数:", { exact: false })).toBeVisible();
    await expect(
      page.getByText("Free", { exact: true }).or(page.getByText("Pro", { exact: true }))
    ).toBeVisible();
    await expect(
      page.getByText(/課金はまだ設定されていません|Pro にアップグレード/)
    ).toBeVisible();
  });
});
