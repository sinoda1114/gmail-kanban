export const PROJECT_DETAIL_TABS = [
  "basic",
  "interview_prep",
  "interview_note",
  "history",
] as const;

export type ProjectDetailTab = (typeof PROJECT_DETAIL_TABS)[number];

const TAB_ALIASES: Record<string, ProjectDetailTab> = {
  basic: "basic",
  interview_prep: "interview_prep",
  "interview-prep": "interview_prep",
  interview_note: "interview_note",
  "interview-note": "interview_note",
  history: "history",
};

export function resolveProjectDetailTab(tab?: string): ProjectDetailTab {
  if (!tab) return "basic";
  return TAB_ALIASES[tab] ?? "basic";
}
