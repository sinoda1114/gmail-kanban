import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Container,
  Title,
  Stack,
  Text,
  Paper,
  Badge,
  List,
  ThemeIcon,
  Button,
  Anchor,
  Code,
} from "@mantine/core";
import {
  IconCalendar,
  IconCheck,
  IconCreditCard,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  GMAIL_READONLY_SCOPE,
  getGoogleOAuthStatus,
} from "@/lib/clerk-google-oauth";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  if (!user) redirect("/onboarding");

  const googleStatus = await getGoogleOAuthStatus(userId);

  return (
    <DashboardShell>
      <Container size="lg" py="md">
        <Title order={2} mb="lg">
          設定
        </Title>

        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Stack gap={4}>
                <Title order={4}>課金・プラン</Title>
                <Text size="sm" c="dimmed">
                  現在のプラン、案件数の上限、Pro へのアップグレードは課金画面で確認できます。
                </Text>
              </Stack>
              <Button
                variant="light"
                leftSection={<IconCreditCard size={16} />}
                component={Link}
                href="/dashboard/billing"
              >
                課金・プランを開く
              </Button>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Stack gap={4}>
                <Title order={4}>Google カレンダー連携</Title>
                <Text size="sm" c="dimmed">
                  面談準備で設定した日時を、Google カレンダーに登録するために使います。
                  Clerk 経由で取得した Google OAuth トークンで Calendar API
                  を呼び出しています。
                </Text>
              </Stack>

              {googleStatus.connected ? (
                <Badge
                  size="lg"
                  variant="light"
                  color="green"
                  leftSection={
                    <ThemeIcon size={16} color="green" variant="transparent">
                      <IconCheck size={14} />
                    </ThemeIcon>
                  }
                >
                  連携済み
                </Badge>
              ) : (
                <>
                  <Badge
                    size="lg"
                    variant="light"
                    color="red"
                    leftSection={
                      <ThemeIcon size={16} color="red" variant="transparent">
                        <IconX size={14} />
                      </ThemeIcon>
                    }
                  >
                    未連携
                  </Badge>
                  <Text size="sm">{googleStatus.message}</Text>
                  <Paper withBorder p="sm" radius="sm" bg="var(--mantine-color-gray-light)">
                    <Stack gap="xs">
                      <Text size="sm" fw={600}>
                        連携手順
                      </Text>
                      <List size="sm" spacing="xs">
                        <List.Item>
                          右上のプロフィール（UserButton）→「アカウント管理」から
                          Google アカウントを連携してください。
                        </List.Item>
                        <List.Item>
                          初回サインイン時に Google
                          を選んでいない場合は、上記から追加できます。
                        </List.Item>
                        <List.Item>
                          連携後、このページを再読み込みするとステータスが更新されます。
                        </List.Item>
                      </List>
                      <Text size="xs" c="dimmed">
                        管理者向け: Clerk Dashboard の Google OAuth
                        プロバイダで Calendar API
                        スコープが有効である必要があります。トークンが取得できても API
                        呼び出しが失敗する場合はスコープ設定を確認してください。
                      </Text>
                    </Stack>
                  </Paper>
                </>
              )}

              <Text size="xs" c="dimmed">
                <IconCalendar
                  size={14}
                  style={{ verticalAlign: "text-bottom", marginRight: 4 }}
                />
                案件詳細の面談準備タブからカレンダー登録を実行できます。
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Stack gap={4}>
                <Title order={4}>Gmail 連携</Title>
                <Text size="sm" c="dimmed">
                  案件登録・更新時に Gmail スレッドを取得し、メール本文欄へ反映するために使います。
                  Clerk 経由の Google OAuth トークンで Gmail API（読み取り専用）を呼び出しています。
                  メールの自動送信は行いません。
                </Text>
              </Stack>

              {googleStatus.connected ? (
                <Badge
                  size="lg"
                  variant="light"
                  color="green"
                  leftSection={
                    <ThemeIcon size={16} color="green" variant="transparent">
                      <IconCheck size={14} />
                    </ThemeIcon>
                  }
                >
                  Google 連携済み
                </Badge>
              ) : (
                <>
                  <Badge
                    size="lg"
                    variant="light"
                    color="red"
                    leftSection={
                      <ThemeIcon size={16} color="red" variant="transparent">
                        <IconX size={14} />
                      </ThemeIcon>
                    }
                  >
                    未連携
                  </Badge>
                  <Text size="sm">{googleStatus.message}</Text>
                  <Paper withBorder p="sm" radius="sm" bg="var(--mantine-color-gray-light)">
                    <Stack gap="xs">
                      <Text size="sm" fw={600}>
                        連携手順
                      </Text>
                      <List size="sm" spacing="xs">
                        <List.Item>
                          右上のプロフィール（UserButton）→「アカウント管理」から
                          Google アカウントを連携してください。
                        </List.Item>
                        <List.Item>
                          連携後、このページを再読み込みするとステータスが更新されます。
                        </List.Item>
                      </List>
                    </Stack>
                  </Paper>
                </>
              )}

              <Paper withBorder p="sm" radius="sm" bg="var(--mantine-color-gray-light)">
                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    必要な OAuth スコープ
                  </Text>
                  <Code block>{GMAIL_READONLY_SCOPE}</Code>
                  <Text size="xs" c="dimmed">
                    Gmail 取得で権限エラーが出る場合は、Clerk Dashboard の Google
                    OAuth プロバイダに上記スコープを追加し、Google
                    アカウントの再連携（再ログイン）を行ってください。
                  </Text>
                </Stack>
              </Paper>

              <Text size="xs" c="dimmed">
                <IconMail
                  size={14}
                  style={{ verticalAlign: "text-bottom", marginRight: 4 }}
                />
                <Anchor href="/dashboard/projects/new" size="xs">
                  案件登録
                </Anchor>
                や案件詳細の「メール再貼り付けで更新」から Gmail
                取得を試せます。詳細は{" "}
                <Anchor href="/dashboard/gmail" size="xs">
                  Gmail 連携の説明
                </Anchor>
                を参照してください。
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </DashboardShell>
  );
}
