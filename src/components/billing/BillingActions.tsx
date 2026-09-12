"use client";

import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/app/dashboard/billing/billing-action";

export function BillingActions({
  canUpgrade,
  canManage,
}: {
  canUpgrade: boolean;
  canManage: boolean;
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function startCheckout() {
    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession();
      if (!result.success) {
        notifications.show({
          color: "red",
          title: "Checkout エラー",
          message: result.error,
        });
        return;
      }
      window.location.assign(result.url);
    } catch {
      notifications.show({
        color: "red",
        title: "Checkout エラー",
        message: "Checkout の開始に失敗しました",
      });
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const result = await createBillingPortalSession();
      if (!result.success) {
        notifications.show({
          color: "red",
          title: "ポータルエラー",
          message: result.error,
        });
        return;
      }
      window.location.assign(result.url);
    } catch {
      notifications.show({
        color: "red",
        title: "ポータルエラー",
        message: "お支払い管理の開始に失敗しました",
      });
    } finally {
      setPortalLoading(false);
    }
  }

  if (!canUpgrade && !canManage) return null;

  return (
    <Group>
      {canUpgrade && (
        <Button loading={checkoutLoading} onClick={startCheckout}>
          Pro にアップグレード
        </Button>
      )}
      {canManage && (
        <Button
          variant="light"
          loading={portalLoading}
          onClick={openPortal}
        >
          お支払いを管理
        </Button>
      )}
    </Group>
  );
}
