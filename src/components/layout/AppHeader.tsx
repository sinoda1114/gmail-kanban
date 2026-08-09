"use client";

import Link from "next/link";
import { Group, Title, Button } from "@mantine/core";
import { UserButton } from "@clerk/nextjs";
import { IconBell, IconMail, IconSettings } from "@tabler/icons-react";

export function AppHeader() {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Link
        href="/dashboard"
        aria-label="ダッシュボードへ移動"
        style={{
          color: "inherit",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <Group gap="xs" wrap="nowrap">
          <IconMail size={24} />
          <Title order={4}>Gmail Kanban</Title>
        </Group>
      </Link>
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
