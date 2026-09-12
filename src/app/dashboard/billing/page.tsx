import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Alert,
  Anchor,
  Badge,
  Container,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { BillingActions } from "@/components/billing/BillingActions";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProjectLimitStatus } from "@/lib/billing";
import {
  PENDING_SUBSCRIPTION_MESSAGE,
  PLAN_LIMITS,
  getProCheckoutBlock,
} from "@/lib/billing-limits";

function planLabel(plan: "free" | "pro"): string {
  return plan === "pro" ? "Pro" : "Free";
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  if (!user) redirect("/onboarding");

  const { success } = await searchParams;
  const limit = await getProjectLimitStatus(user.id);
  const checkoutReady = Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRO_PRICE_ID &&
      process.env.NEXT_PUBLIC_SITE_URL
  );
  const portalReady = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_SITE_URL
  );
  const checkoutBlock = getProCheckoutBlock(limit);
  const canUpgrade = checkoutReady && !checkoutBlock.blocked;
  const usageLabel =
    limit.maxProjects === null
      ? `${limit.currentCount} 件（無制限）`
      : `${limit.currentCount} / ${limit.maxProjects} 件`;
  const periodEndLabel = limit.currentPeriodEnd
    ? new Date(limit.currentPeriodEnd).toLocaleDateString("ja-JP")
    : null;

  return (
    <DashboardShell>
      <Container size="md" py="md">
        <Title order={2} mb="lg">
          プラン
        </Title>

        <Stack gap="md">
          {success === "true" && (
            <Alert color="teal" title="手続きを受け付けました">
              アップグレードの反映まで少し時間がかかることがあります。このページを再読み込みしてプラン表示を確認してください。
            </Alert>
          )}

          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Title order={4}>現在のプラン</Title>
              <Badge
                size="lg"
                variant="light"
                color={limit.effectivePlan === "pro" ? "teal" : "gray"}
              >
                {planLabel(limit.effectivePlan)}
              </Badge>
              {limit.plan === "pro" && limit.effectivePlan === "free" && (
                <Text size="sm" c="dimmed">
                  サブスク状態: {limit.status}
                  {periodEndLabel ? `（期限 ${periodEndLabel}）` : ""}
                </Text>
              )}
              {limit.effectivePlan === "pro" && periodEndLabel && (
                <Text size="sm" c="dimmed">
                  現在の期間終了日: {periodEndLabel}
                </Text>
              )}
              <Text size="sm">案件数: {usageLabel}</Text>
              <Text size="sm" c="dimmed">
                Free は案件 {PLAN_LIMITS.free.maxProjects}{" "}
                件まで。Pro は案件数の上限がありません。
              </Text>
              {limit.effectivePlan === "free" && (
                <Anchor href="/dashboard/projects/new" size="sm">
                  案件登録へ
                </Anchor>
              )}
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Title order={4}>アップグレード</Title>
              {limit.effectivePlan === "pro" ? (
                <Text size="sm" c="dimmed">
                  Pro プランです。カード情報の変更や解約は「お支払いを管理」から行えます。
                </Text>
              ) : checkoutBlock.blocked ? (
                <Text size="sm" c="dimmed">
                  {PENDING_SUBSCRIPTION_MESSAGE}
                </Text>
              ) : checkoutReady ? (
                <Text size="sm" c="dimmed">
                  Stripe Checkout で Pro にアップグレードします。決済画面は Stripe がホストします。
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  課金はまだ設定されていません。アップグレードは現在利用できません。
                </Text>
              )}
              <BillingActions
                canUpgrade={canUpgrade}
                canManage={portalReady && Boolean(limit.stripeCustomerId)}
              />
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </DashboardShell>
  );
}
