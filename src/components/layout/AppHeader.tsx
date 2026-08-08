"use client";

import Link from "next/link";
import { Group, Title, UnstyledButton } from "@mantine/core";
import { UserButton } from "@clerk/nextjs";
import { IconMail } from "@tabler/icons-react";

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
      <UserButton />
    </Group>
  );
}
