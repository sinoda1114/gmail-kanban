import {
  PROJECT_STATUSES,
  REMINDER_TYPES,
  type ProjectStatus,
  type ReminderType,
} from "@/types/project";

/** status|reminderType|bucket — longest realistic value is well under this cap */
export const REMINDER_FINGERPRINT_MAX_LENGTH = 128;

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

const PROJECT_STATUS_SET = new Set<string>(PROJECT_STATUSES);
const REMINDER_TYPE_SET = new Set<string>(REMINDER_TYPES);
const DATE_BUCKET_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAYS_BUCKET_RE = /^\d{1,10}$/;

export function validateReminderFingerprint(
  fingerprint: string,
  options?: { expectedReminderType?: ReminderType }
): { valid: true; fingerprint: string } | { valid: false; error: string } {
  const trimmed = fingerprint.trim();
  if (!trimmed) {
    return { valid: false, error: "Invalid fingerprint" };
  }
  if (trimmed.length > REMINDER_FINGERPRINT_MAX_LENGTH) {
    return { valid: false, error: "Invalid fingerprint" };
  }

  const parts = trimmed.split("|");
  if (parts.length !== 3) {
    return { valid: false, error: "Invalid fingerprint" };
  }

  const [status, reminderType, bucket] = parts;
  if (!PROJECT_STATUS_SET.has(status)) {
    return { valid: false, error: "Invalid fingerprint" };
  }
  if (!REMINDER_TYPE_SET.has(reminderType)) {
    return { valid: false, error: "Invalid fingerprint" };
  }
  if (
    options?.expectedReminderType &&
    reminderType !== options.expectedReminderType
  ) {
    return { valid: false, error: "Invalid fingerprint" };
  }

  if (reminderType === "interview") {
    if (!DATE_BUCKET_RE.test(bucket)) {
      return { valid: false, error: "Invalid fingerprint" };
    }
  } else if (!DAYS_BUCKET_RE.test(bucket)) {
    return { valid: false, error: "Invalid fingerprint" };
  }

  if (
    trimmed !==
    buildReminderFingerprint({
      projectStatus: status as ProjectStatus,
      reminderType: reminderType as ReminderType,
      daysElapsed: reminderType === "interview" ? 0 : Number(bucket),
      interviewDate: reminderType === "interview" ? bucket : undefined,
    })
  ) {
    return { valid: false, error: "Invalid fingerprint" };
  }

  return { valid: true, fingerprint: trimmed };
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
