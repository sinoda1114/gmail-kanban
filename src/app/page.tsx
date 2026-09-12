import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  Anchor,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <Container size="sm" py={80}>
      <Stack gap="xl">
        <Stack gap="sm">
          <Title order={1}>Gmail Kanban</Title>
          <Text size="lg" c="dimmed">
            Gmail に届く案件メールを、カンバンで追う。次に返すもの、面談の準備、期限が同じ画面に並ぶ。
          </Text>
        </Stack>

        <Group>
          <Button component="a" href="/sign-up" size="md">
            無料で始める
          </Button>
          <Button component="a" href="/sign-in" variant="light" size="md">
            ログイン
          </Button>
        </Group>

        <Stack gap="xs">
          <Text>案件のステータスとボールの所在が見える</Text>
          <Text>要対応だけを一覧できる</Text>
          <Text>面談準備と返信ドラフトまで一箇所で進める</Text>
        </Stack>

        <Text size="sm" c="dimmed">
          アカウント作成は{" "}
          <Anchor href="/sign-up">サインアップ</Anchor>
          、既存ユーザーは{" "}
          <Anchor href="/sign-in">サインイン</Anchor>
          。
        </Text>
      </Stack>
    </Container>
  );
}
