export const PROJECT_STATUSES = [
  "reply_required",
  "waiting_reply",
  "document_screening",
  "interview_scheduling",
  "interview_scheduled",
  "waiting_result",
  "on_hold",
  "closed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  reply_required: "返信必要",
  waiting_reply: "相手返信待ち",
  document_screening: "書類選考中",
  interview_scheduling: "面談調整中",
  interview_scheduled: "面談予定",
  waiting_result: "結果待ち",
  on_hold: "保留",
  closed: "終了",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  reply_required: "red",
  waiting_reply: "orange",
  document_screening: "yellow",
  interview_scheduling: "blue",
  interview_scheduled: "violet",
  waiting_result: "teal",
  on_hold: "gray",
  closed: "dark",
};

export const CLOSE_REASONS = [
  "declined",
  "rejected",
  "condition_mismatch",
  "no_response",
  "other",
] as const;

export type CloseReason = (typeof CLOSE_REASONS)[number];

export const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  declined: "辞退",
  rejected: "見送り",
  condition_mismatch: "条件不一致",
  no_response: "音信不通",
  other: "その他",
};

export const REMINDER_TYPES = [
  "reply",
  "follow_up",
  "interview",
  "result",
  "on_hold_recheck",
] as const;

export type ReminderType = (typeof REMINDER_TYPES)[number];
