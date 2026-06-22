"use client";

import { Group, Title } from "@mantine/core";
import { UserButton } from "@clerk/nextjs";
import { IconMail } from "@tabler/icons-react";

export function AppHeader() {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap="xs">
        <IconMail size={24} />
        <Title order={4}>Gmail Kanban</Title>
      </Group>
      <UserButton />
    </Group>
  );
}
