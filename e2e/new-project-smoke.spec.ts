import { test, expect } from "@playwright/test";
import {
  prepareClerkTestingPage,
  resolveE2eClerkUserEmail,
  signInE2eTestUser,
} from "./helpers/clerk";

const e2eUserEmail = resolveE2eClerkUserEmail();
const skipReason =
  "E2E_CLERK_USER_EMAIL または ~/.config/gmail-kanban-secrets/e2e-user.json が未設定です。";

test.describe("案件登録", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await prepareClerkTestingPage(page);
  });

  test("タイトルを入れて登録すると案件詳細へ進む", async ({ page }) => {
    if (!e2eUserEmail) {
      test.skip(true, skipReason);
      return;
    }

    const title = `E2E案件 ${Date.now()}`;

    await signInE2eTestUser(page, e2eUserEmail);
    await page.goto("/dashboard/projects/new");
    await expect(page.getByRole("heading", { name: "案件登録" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "キャンセル" })).toBeVisible();
    await expect(page.getByText(/案件 \d+/)).toBeVisible();
    if (await page.getByText("案件数の上限").isVisible()) {
      throw new Error(
        "Free プランの案件数上限に達しています。E2E ユーザーの作りっぱなし案件を削除してください。"
      );
    }

    await page.getByRole("textbox", { name: "案件タイトル *" }).fill(title);
    await page.getByRole("button", { name: "登録する" }).click();

    await expect(page).not.toHaveURL(/\/dashboard\/projects\/new$/);
    await expect(page).toHaveURL(
      /\/dashboard\/projects\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    await expect(page.getByRole("heading", { name: title })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("tab", { name: "基本情報" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "面談対策" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "面談準備" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "面談練習" })).toBeVisible();
    await expect(page.getByRole("link", { name: "案件一覧へ戻る" })).toBeVisible();

    await page.getByRole("tab", { name: "面談対策" }).click();
    await expect(
      page.getByRole("button", { name: "AIで面談対策を作成" })
    ).toBeVisible();

    await page.getByRole("tab", { name: "面談練習" }).click();
    const modeGroup = page.getByRole("group", { name: "入力モード" });
    await expect(modeGroup).toBeVisible();
    await expect(modeGroup.getByText("テキスト", { exact: true })).toBeVisible();
    await expect(modeGroup.getByText("音声", { exact: true })).toBeVisible();
    await modeGroup.getByText("音声", { exact: true }).click();
    await expect(
      page.getByText("相手役の質問を読み上げ、マイクで答えます")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "通し練習を開始" })
    ).toBeVisible();

    await page.getByRole("link", { name: "案件一覧へ戻る" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(title)).toBeVisible();
  });
});
