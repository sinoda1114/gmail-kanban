"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import {
  Stack,
  Group,
  Badge,
  Text,
  Paper,
  Anchor,
  Button,
  Switch,
} from "@mantine/core";
import { STATUS_LABELS, STATUS_COLORS, type ProjectStatus } from "@/types/project";
import type { ReminderItem } from "@/lib/reminders";
import { markReminderDone } from "@/app/dashboard/alerts/reminder-action";

type AlertsListProps = {
  activeReminders: ReminderItem[];
  doneReminders: ReminderItem[];
};

export function AlertsList({ activeReminders, doneReminders }: AlertsListProps) {
  const router = useRouter();
  const [showDone, setShowDone] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDismiss = (item: ReminderItem) => {
    const key = item.projectId + item.reminderType;
    setPendingKey(key);
    startTransition(async () => {
      try {
        const result = await markReminderDone({
          projectId: item.projectId,
          reminderType: item.reminderType,
          fingerprint: item.fingerprint,
        });
        if (!result.success) {
          notifications.show({
            color: "red",
            message: result.error ?? "対応済みの保存に失敗しました",
          });
          return;
        }
        router.refresh();
      } catch {
        notifications.show({
          color: "red",
          message: "対応済みの保存に失敗しました",
        });
      } finally {
        setPendingKey(null);
      }
    });
  };

  const visibleReminders = showDone
    ? [...activeReminders, ...doneReminders]
    : activeReminders;

  if (activeReminders.length === 0 && doneReminders.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        現在、対応が必要な案件はありません。
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {doneReminders.length > 0 && (
        <Group justify="flex-end">
          <Switch
            label="対応済みを表示"
            checked={showDone}
            onChange={(e) => setShowDone(e.currentTarget.checked)}
            size="sm"
          />
        </Group>
      )}

      {visibleReminders.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          未対応の案件はありません。対応済みを表示で確認できます。
        </Text>
      ) : (
        <Stack gap="sm">
          {visibleReminders.map((r) => {
            const isDone = doneReminders.some(
              (d) =>
                d.projectId === r.projectId && d.reminderType === r.reminderType
            );
            const itemKey = r.projectId + r.reminderType;
            const dismissing = isPending && pendingKey === itemKey;

            return (
              <Paper
                key={itemKey}
                withBorder
                p="md"
                radius="md"
                opacity={isDone ? 0.65 : 1}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Stack gap={4} flex={1}>
                    <Anchor
                      href={`/dashboard/projects/${r.projectId}`}
                      fw={600}
                      size="sm"
                    >
                      {r.projectTitle}
                    </Anchor>
                    <Group gap="xs">
                      <Badge
                        size="xs"
                        variant="light"
                        color={
                          STATUS_COLORS[r.projectStatus as ProjectStatus] ?? "gray"
                        }
                      >
                        {STATUS_LABELS[r.projectStatus as ProjectStatus] ??
                          r.projectStatus}
                      </Badge>
                      {r.reminderType !== "interview" && (
                        <Text size="xs" c="dimmed">
                          {r.daysElapsed}日経過
                        </Text>
                      )}
                      {r.reminderType === "interview" && (
                        <Text size="xs" c="dimmed">
                          明日面談
                        </Text>
                      )}
                      {isDone && (
                        <Badge size="xs" variant="outline" color="gray">
                          対応済み
                        </Badge>
                      )}
                    </Group>
                  </Stack>
                  <Group gap="xs" wrap="nowrap">
                    <Badge
                      size="sm"
                      variant="filled"
                      color={r.badgeColor}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {r.label}
                    </Badge>
                    {!isDone && (
                      <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        loading={dismissing}
                        onClick={() => handleDismiss(r)}
                      >
                        対応済み
                      </Button>
                    )}
                  </Group>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
