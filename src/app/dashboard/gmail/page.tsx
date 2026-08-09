import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Container,
  Title,
  Text,
  Alert,
  Stack,
  Anchor,
  Code,
  Button,
  Group,
} from "@mantine/core";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { GMAIL_READONLY_SCOPE } from "@/lib/clerk-google-oauth";

export default async function GmailHelperPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <DashboardShell>
      <Container size="md" py="xl">
        <Group mb="md">
          <Title order={2}>Gmail 連携</Title>
          <Button variant="subtle" component="a" href="/dashboard/projects/new">
            案件登録へ
          </Button>
        </Group>

        <Stack gap="md">
          <Text>
            Gmail Kanban は Gmail API（読み取り専用）でメールスレッドを取得し、案件登録の
            「メール本文」欄に反映します。メールの自動送信は行いません。
          </Text>

          <Alert color="blue" title="必要な Google 権限">
            <Stack gap="xs">
              <Text size="sm">
                Google アカウントに次の OAuth スコープの許可が必要です:
              </Text>
              <Code block>{GMAIL_READONLY_SCOPE}</Code>
              <Text size="sm">
                Clerk Dashboard の Google ソーシャル接続に上記スコープを追加し、ユーザーは
                Google アカウントの再連携（再ログイン）が必要になる場合があります。
              </Text>
            </Stack>
          </Alert>

          <Alert color="yellow" title="URL 形式の制限">
            <Text size="sm">
              Gmail Web の新しい URL 形式（<Code>FMfcgz</Code>{" "}
              で始まる ID）は Gmail API では開けません。英数字の古い形式の URL、API
              用スレッド ID を使うか、本文を手動で貼り付けてください。
            </Text>
          </Alert>

          <Text size="sm" c="dimmed">
            設定の詳細は{" "}
            <Anchor href="/dashboard/projects/new">案件登録ページ</Anchor>{" "}
            からも Gmail 取得を試せます。
          </Text>
        </Stack>
      </Container>
    </DashboardShell>
  );
}
