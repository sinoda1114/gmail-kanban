"use client";

import Link from "next/link";
import { Group, Title, UnstyledButton, Button } from "@mantine/core";
import { UserButton } from "@clerk/nextjs";
import { IconBell, IconCreditCard, IconMail, IconSettings } from "@tabler/icons-react";

export function AppHeader() {
  return (
    <Group h="100%" px="md" justify="space-between">
      <UnstyledButton
        component={Link}
        href="/dashboard"
        aria-label="ダッシュボードへ移動"
        style={{ color: "inherit" }}
      >
        <Group gap="xs">
          <IconMail size={24} />
          <Title order={4}>Gmail Kanban</Title>
        </Group>
      </UnstyledButton>
      <Group gap="xs">
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconBell size={16} />}
          component={Link}
          href="/dashboard/alerts"
        >
          要対応
        </Button>
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconCreditCard size={16} />}
          component={Link}
          href="/dashboard/billing"
        >
          課金
        </Button>
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconSettings size={16} />}
          component={Link}
          href="/dashboard/settings"
        >
          設定
        </Button>
        <UserButton />
      </Group>
    </Group>
  );
}
