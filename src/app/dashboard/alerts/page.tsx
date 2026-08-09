import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Container, Title } from "@mantine/core";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AlertsList } from "@/components/alerts/AlertsList";
import { db } from "@/db/client";
import { projects, users, interviewPreparations, reminders } from "@/db/schema";
import { eq, and, notInArray } from "drizzle-orm";
import type { ReminderType } from "@/types/project";
import {
  buildReminderFingerprint,
  isReminderDismissed,
  type ReminderItem,
} from "@/lib/reminders";

const REMINDER_LABELS: Record<ReminderType, string> = {
  reply: "要対応",
  follow_up: "催促候補",
  interview: "面談準備リマインド",
  result: "進捗確認候補",
  on_hold_recheck: "再確認候補",
};

const REMINDER_COLORS: Record<ReminderType, string> = {
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

function makeReminder(
  base: Omit<ReminderItem, "fingerprint"> & { interviewDate?: string }
): ReminderItem {
  const { interviewDate, ...rest } = base;
  return {
    ...rest,
    interviewDate,
    fingerprint: buildReminderFingerprint({
      projectStatus: rest.projectStatus,
      reminderType: rest.reminderType,
      daysElapsed: rest.daysElapsed,
      interviewDate,
    }),
  };
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

  const doneRecords = await db
    .select({
      projectId: reminders.projectId,
      reminderType: reminders.reminderType,
      message: reminders.message,
    })
    .from(reminders)
    .where(and(eq(reminders.userId, user.id), eq(reminders.done, true)));

  const prepMap = new Map(preps.map((p) => [p.projectId, p.interviewAt]));
  const tomorrow = tomorrowDateStr();

  const computed: ReminderItem[] = [];

  for (const p of activeProjects) {
    const elapsed = daysSince(p.lastContactAt ?? p.updatedAt);

    if (p.status === "reply_required" && elapsed >= 1) {
      computed.push(
        makeReminder({
          projectId: p.id,
          projectTitle: p.title,
          projectStatus: p.status,
          reminderType: "reply",
          label: REMINDER_LABELS.reply,
          badgeColor: REMINDER_COLORS.reply,
          daysElapsed: elapsed,
        })
      );
    } else if (p.status === "waiting_reply" && elapsed >= 3) {
      computed.push(
        makeReminder({
          projectId: p.id,
          projectTitle: p.title,
          projectStatus: p.status,
          reminderType: "follow_up",
          label: REMINDER_LABELS.follow_up,
          badgeColor: REMINDER_COLORS.follow_up,
          daysElapsed: elapsed,
        })
      );
    } else if (p.status === "interview_scheduled") {
      const interviewAt = prepMap.get(p.id);
      if (interviewAt && interviewAt.slice(0, 10) === tomorrow) {
        computed.push(
          makeReminder({
            projectId: p.id,
            projectTitle: p.title,
            projectStatus: p.status,
            reminderType: "interview",
            label: REMINDER_LABELS.interview,
            badgeColor: REMINDER_COLORS.interview,
            daysElapsed: 0,
            interviewDate: interviewAt.slice(0, 10),
          })
        );
      }
    } else if (p.status === "waiting_result" && elapsed >= 5) {
      computed.push(
        makeReminder({
          projectId: p.id,
          projectTitle: p.title,
          projectStatus: p.status,
          reminderType: "result",
          label: REMINDER_LABELS.result,
          badgeColor: REMINDER_COLORS.result,
          daysElapsed: elapsed,
        })
      );
    } else if (p.status === "on_hold" && elapsed >= 7) {
      computed.push(
        makeReminder({
          projectId: p.id,
          projectTitle: p.title,
          projectStatus: p.status,
          reminderType: "on_hold_recheck",
          label: REMINDER_LABELS.on_hold_recheck,
          badgeColor: REMINDER_COLORS.on_hold_recheck,
          daysElapsed: elapsed,
        })
      );
    }
  }

  const ORDER: Record<ReminderType, number> = {
    reply: 0,
    follow_up: 1,
    interview: 2,
    result: 3,
    on_hold_recheck: 4,
  };
  computed.sort((a, b) => ORDER[a.reminderType] - ORDER[b.reminderType]);

  const activeReminders = computed.filter(
    (r) => !isReminderDismissed(r, doneRecords)
  );
  const doneReminders = computed.filter((r) =>
    isReminderDismissed(r, doneRecords)
  );

  return (
    <DashboardShell>
      <Container size="lg" py="md">
        <Title order={2} mb="lg">
          要対応一覧
        </Title>
        <AlertsList
          activeReminders={activeReminders}
          doneReminders={doneReminders}
        />
      </Container>
    </DashboardShell>
  );
}
