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
