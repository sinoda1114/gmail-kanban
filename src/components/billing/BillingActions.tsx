"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "@/app/dashboard/billing/billing-action";
import type { BillingPlan } from "@/lib/billing";
import { PLAN_LABELS } from "@/lib/billing";

type BillingActionsProps = {
  effectivePlan: BillingPlan;
  projectCountLabel: string;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
};

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
}

export function BillingActions({
  effectivePlan,
  projectCountLabel,
  currentPeriodEnd,
  hasStripeCustomer,
}: BillingActionsProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession();
      if (!result.success) {
        notifications.show({
          color: "red",
          title: "アップグレードエラー",
          message: result.error,
        });
        return;
      }
      window.location.href = result.url;
    } catch {
      notifications.show({
        color: "red",
        title: "アップグレードエラー",
        message: "Checkout の開始に失敗しました",
      });
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const result = await createCustomerPortalSession();
      if (!result.success) {
        notifications.show({
          color: "red",
          title: "サブスクリプション管理エラー",
          message: result.error,
        });
        return;
      }
      window.location.href = result.url;
    } catch {
      notifications.show({
        color: "red",
        title: "サブスクリプション管理エラー",
        message: "Customer Portal の開始に失敗しました",
      });
    } finally {
      setPortalLoading(false);
    }
  }

  const periodEndLabel = formatPeriodEnd(currentPeriodEnd);
  const isPro = effectivePlan === "pro";

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={4}>現在のプラン</Title>
              <Text size="sm" c="dimmed">
                案件数の上限はプランによって異なります。
              </Text>
            </Stack>
            <Badge size="lg" variant="light" color={isPro ? "violet" : "gray"}>
              {PLAN_LABELS[effectivePlan]}
            </Badge>
          </Group>

          <Text size="sm">
            <Text span fw={600}>登録案件数: </Text>
            {projectCountLabel}
          </Text>

          {isPro && periodEndLabel && (
            <Text size="sm" c="dimmed">
              次回更新日: {periodEndLabel}
            </Text>
          )}

          {!isPro && (
            <Text size="sm" c="dimmed">
              Free プランでは案件は 5 件まで。Pro プランで無制限に登録できます。
            </Text>
          )}

          <Group gap="sm">
            {!isPro && (
              <Button loading={checkoutLoading} onClick={handleUpgrade}>
                Pro にアップグレード
              </Button>
            )}
            {isPro && hasStripeCustomer && (
              <Button
                variant="light"
                loading={portalLoading}
                onClick={handleManageSubscription}
              >
                サブスクリプションを管理
              </Button>
            )}
            <Button variant="subtle" component={Link} href="/dashboard">
              ダッシュボードへ
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
