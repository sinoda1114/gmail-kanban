import { test, expect } from "@playwright/test";
import {
  prepareClerkTestingPage,
  resolveE2eClerkUserEmail,
  signInE2eTestUser,
} from "./helpers/clerk";

const e2eUserEmail = resolveE2eClerkUserEmail();

test.describe("設定画面", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await prepareClerkTestingPage(page);
  });

  test("サインイン後に設定のカレンダーと Gmail 連携ブロックが見える", async ({
    page,
  }) => {
    if (!e2eUserEmail) {
      test.skip(
        true,
        "E2E_CLERK_USER_EMAIL または ~/.config/gmail-kanban-secrets/e2e-user.json が未設定です。"
      );
      return;
    }

    await signInE2eTestUser(page, e2eUserEmail);
    const response = await page.goto("/dashboard/settings", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Google カレンダー連携" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Gmail 連携" })
    ).toBeVisible();
  });
});
