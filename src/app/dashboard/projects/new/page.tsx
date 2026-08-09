import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Container,
  Title,
  Group,
  Button,
  Alert,
  Text,
  Anchor,
  Code,
} from "@mantine/core";
import { GMAIL_READONLY_SCOPE } from "@/lib/clerk-google-oauth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { NewProjectForm } from "@/components/projects/NewProjectForm";

export default async function NewProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <DashboardShell>
      <Container size="md" py="xl">
        <Group mb="xl">
          <Title order={2}>案件登録</Title>
          <Button variant="subtle" component="a" href="/dashboard">
            キャンセル
          </Button>
        </Group>
        <Alert color="blue" mb="lg" title="Gmail からの取得について">
          <Text size="sm">
            「Gmailから取得」は Google アカウントの Gmail 読み取り権限（
            <Code>{GMAIL_READONLY_SCOPE}</Code>
            ）が必要です。権限エラーが出る場合は{" "}
            <Anchor href="/dashboard/gmail">Gmail 連携の説明</Anchor>
            を参照し、Clerk の Google OAuth 設定と再連携を確認してください。
            FMfcgz 形式の URL は API 非対応のため、手動ペーストも利用できます。
          </Text>
        </Alert>
        <NewProjectForm />
      </Container>
    </DashboardShell>
  );
}
