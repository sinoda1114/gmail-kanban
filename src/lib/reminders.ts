import type { ReminderType } from "@/types/project";

export type ReminderItem = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  reminderType: ReminderType;
  label: string;
  badgeColor: string;
  daysElapsed: number;
  /** YYYY-MM-DD for interview reminders */
  interviewDate?: string;
  fingerprint: string;
};

/**
 * Reappearance rule: done is keyed by status + reminder type + contextual date bucket.
 * If project status changes, daysElapsed changes, or interview date changes, the
 * fingerprint differs and the alert shows again even if previously dismissed.
 */
export function buildReminderFingerprint(input: {
  projectStatus: string;
  reminderType: ReminderType;
  daysElapsed: number;
  interviewDate?: string;
}): string {
  const bucket =
    input.reminderType === "interview"
      ? (input.interviewDate ?? "")
      : String(input.daysElapsed);
  return `${input.projectStatus}|${input.reminderType}|${bucket}`;
}

export function isReminderDismissed(
  item: Pick<ReminderItem, "projectId" | "reminderType" | "fingerprint">,
  doneRecords: { projectId: string; reminderType: string; message: string | null }[]
): boolean {
  return doneRecords.some(
    (r) =>
      r.projectId === item.projectId &&
      r.reminderType === item.reminderType &&
      r.message === item.fingerprint
  );
}
