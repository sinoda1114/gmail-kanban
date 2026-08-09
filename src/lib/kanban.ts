import type { Project } from "@/db/schema";
import { isProjectStatus, type ProjectStatus } from "@/types/project";

export function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getContactReferenceDate(
  project: Pick<Project, "lastContactAt" | "updatedAt">
): string {
  return project.lastContactAt ?? project.updatedAt;
}

export function formatElapsedDays(
  project: Pick<Project, "lastContactAt" | "updatedAt">
): string {
  const days = daysSince(getContactReferenceDate(project));
  if (days === 0) return "今日";
  return `${days}日経過`;
}

export type OwnershipHint = { label: string; color: string };

export function getOwnershipHint(status: string): OwnershipHint | null {
  if (status === "reply_required") return { label: "自分が返す", color: "red" };
  if (status === "waiting_reply") return { label: "相手待ち", color: "orange" };
  return null;
}

export function isStaleProject(project: Project): boolean {
  const elapsed = daysSince(getContactReferenceDate(project));
  switch (project.status) {
    case "reply_required": return elapsed >= 1;
    case "waiting_reply": return elapsed >= 3;
    case "waiting_result": return elapsed >= 5;
    case "on_hold": return elapsed >= 7;
    default: return false;
  }
}

export function isActionableCard(project: Project): boolean {
  return project.status === "reply_required" || isStaleProject(project);
}

export function formatInterviewDatetime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function matchesKanbanFilter(
  project: Project,
  searchText: string,
  statusFilters: ProjectStatus[]
): boolean {
  if (statusFilters.length > 0 && isProjectStatus(project.status) && !statusFilters.includes(project.status)) return false;
  if (statusFilters.length > 0 && !isProjectStatus(project.status)) return false;
  const query = searchText.trim().toLowerCase();
  if (!query) return true;
  const haystack = [project.title, project.agentCompany, project.agentPerson, project.techStack?.join(" ") ?? "", project.nextAction]
    .filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

export const COLLAPSED_STATUSES: ProjectStatus[] = ["closed", "on_hold"];
