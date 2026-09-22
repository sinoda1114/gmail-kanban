"use client";

import { Stack, Text, Button, Title, Paper } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { KanChan } from "./KanChan";
import { useState, useEffect } from "react";

export function EmptyState() {
  const [mood, setMood] = useState<"happy" | "waving" | "thinking">("happy");

  useEffect(() => {
    const moods: Array<"happy" | "waving" | "thinking"> = ["happy", "waving", "thinking"];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % moods.length;
      setMood(moods[currentIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Paper
      p="xl"
      radius="md"
      withBorder
      style={{
        background: "linear-gradient(135deg, #E8F4F8 0%, #F0F9FF 100%)",
        borderColor: "#93C5FD",
      }}
    >
      <Stack align="center" gap="xl" py="xl">
        <KanChan size={160} mood={mood} />
        
        <Stack align="center" gap="md">
          <Title order={3} c="blue.8">
            はじめまして！カンちゃんです
          </Title>
          
          <Text c="dimmed" ta="center" size="sm" maw={400}>
            まだ案件が登録されていないようです。
            <br />
            下のボタンから最初の案件を追加して、
            <br />
            カンバンボードで管理を始めましょう！
          </Text>
        </Stack>

        <Button
          size="lg"
          leftSection={<IconPlus size={20} />}
          component="a"
          href="/dashboard/projects/new"
          variant="gradient"
          gradient={{ from: "blue", to: "cyan", deg: 90 }}
        >
          最初の案件を登録
        </Button>

        <Text size="xs" c="dimmed" ta="center" maw={350}>
          💡 ヒント: Gmail連携で案件を自動取得したり、
          面談対策の準備もできます
        </Text>
      </Stack>
    </Paper>
  );
}
