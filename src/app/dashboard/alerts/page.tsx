import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  AppShell,
  Container,
  Title,
  Stack,
  Group,
  Badge,
  Text,
  Paper,
  Anchor,
} from "@mantine/core";
import { AppHeader } from "@/components/layout/AppHeader";
import { db } from "@/db/client";
import { projects, users, interviewPreparations } from "@/db/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { STATUS_LABELS, STATUS_COLORS, type ProjectStatus } from "@/types/project";

type ReminderItem = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  reminderType: "reply" | "follow_up" | "interview" | "result" | "on_hold_recheck";
  label: string;
  badgeColor: string;
  daysElapsed: number;
};

const REMINDER_LABELS: Record<ReminderItem["reminderType"], string> = {
  reply: "要対応",
  follow_up: "催促候補",
  interview: "面談準備リマインド",
  result: "進捗確認候補",
  on_hold_recheck: "再確認候補",
};

const REMINDER_COLORS: Record<ReminderItem["reminderType"], string> = {
  reply: "red",
  follow_up: "orange",
  interview: "violet",
  result: "teal",
  on_hold_recheck: "gray",
};

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 999;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function toJSTDate(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function tomorrowDateStr(): string {
  const now = toJSTDate(new Date());
  now.setDate(now.getDate() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function AlertsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  if (!user) redirect("/onboarding");

  const activeProjects = await db.query.projects.findMany({
    where: and(
      eq(projects.userId, user.id),
      notInArray(projects.status, ["closed"])
    ),
  });

  const preps = await db
    .select({
      projectId: interviewPreparations.projectId,
      interviewAt: interviewPreparations.interviewAt,
    })
    .from(interviewPreparations)
    .where(eq(interviewPreparations.userId, user.id));

  const prepMap = new Map(preps.map((p) => [p.projectId, p.interviewAt]));
  const tomorrow = tomorrowDateStr();

  const reminders: ReminderItem[] = [];

  for (const p of activeProjects) {
    const elapsed = daysSince(p.lastContactAt ?? p.updatedAt);

    if (p.status === "reply_required" && elapsed >= 1) {
      reminders.push({
        projectId: p.id,
        projectTitle: p.title,
        projectStatus: p.status,
        reminderType: "reply",
        label: REMINDER_LABELS.reply,
        badgeColor: REMINDER_COLORS.reply,
        daysElapsed: elapsed,
      });
    } else if (p.status === "waiting_reply" && elapsed >= 3) {
      reminders.push({
        projectId: p.id,
        projectTitle: p.title,
        projectStatus: p.status,
        reminderType: "follow_up",
        label: REMINDER_LABELS.follow_up,
        badgeColor: REMINDER_COLORS.follow_up,
        daysElapsed: elapsed,
      });
    } else if (p.status === "interview_scheduled") {
      const interviewAt = prepMap.get(p.id);
      if (interviewAt && interviewAt.slice(0, 10) === tomorrow) {
        reminders.push({
          projectId: p.id,
          projectTitle: p.title,
          projectStatus: p.status,
          reminderType: "interview",
          label: REMINDER_LABELS.interview,
          badgeColor: REMINDER_COLORS.interview,
          daysElapsed: 0,
        });
      }
    } else if (p.status === "waiting_result" && elapsed >= 5) {
      reminders.push({
        projectId: p.id,
        projectTitle: p.title,
        projectStatus: p.status,
        reminderType: "result",
        label: REMINDER_LABELS.result,
        badgeColor: REMINDER_COLORS.result,
        daysElapsed: elapsed,
      });
    } else if (p.status === "on_hold" && elapsed >= 7) {
      reminders.push({
        projectId: p.id,
        projectTitle: p.title,
        projectStatus: p.status,
        reminderType: "on_hold_recheck",
        label: REMINDER_LABELS.on_hold_recheck,
        badgeColor: REMINDER_COLORS.on_hold_recheck,
        daysElapsed: elapsed,
      });
    }
  }

  // 優先度順にソート: reply > follow_up > interview > result > on_hold_recheck
  const ORDER: Record<ReminderItem["reminderType"], number> = {
    reply: 0,
    follow_up: 1,
    interview: 2,
    result: 3,
    on_hold_recheck: 4,
  };
  reminders.sort((a, b) => ORDER[a.reminderType] - ORDER[b.reminderType]);

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg" py="md">
          <Title order={2} mb="lg">
            要対応一覧
          </Title>

          {reminders.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              現在、対応が必要な案件はありません。
            </Text>
          ) : (
            <Stack gap="sm">
              {reminders.map((r) => (
                <Paper
                  key={r.projectId + r.reminderType}
                  withBorder
                  p="md"
                  radius="md"
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={4}>
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
                      </Group>
                    </Stack>
                    <Badge
                      size="sm"
                      variant="filled"
                      color={r.badgeColor}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {r.label}
                    </Badge>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
