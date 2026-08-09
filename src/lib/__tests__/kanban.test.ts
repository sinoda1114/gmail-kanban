import { describe, it, expect } from "vitest";
import type { Project } from "@/db/schema";
import {
  formatElapsedDays,
  getOwnershipHint,
  isActionableCard,
  matchesKanbanFilter,
  formatInterviewDatetime,
} from "../kanban";

const base: Project = {
  id: "p1",
  userId: "u1",
  title: "React案件",
  agentCompany: "ABC",
  agentPerson: "田中",
  status: "reply_required",
  closeReason: null,
  gmailUrl: null,
  sourceText: null,
  summary: null,
  price: null,
  workRate: null,
  location: null,
  remoteType: null,
  techStack: ["React", "TypeScript"],
  startDateText: null,
  contractPeriod: null,
  nextAction: "返信する",
  reminderDate: null,
  lastContactAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("kanban helpers", () => {
  it("formatElapsedDays", () => {
    expect(formatElapsedDays({ ...base, updatedAt: new Date().toISOString() })).toBe("今日");
  });
  it("ownership", () => {
    expect(getOwnershipHint("reply_required")?.label).toBe("自分が返す");
  });
  it("actionable", () => {
    expect(isActionableCard(base)).toBe(true);
  });
  it("filter", () => {
    expect(matchesKanbanFilter(base, "react", [])).toBe(true);
    expect(matchesKanbanFilter(base, "", ["closed"])).toBe(false);
  });
  it("interview datetime", () => {
    expect(formatInterviewDatetime("2026-08-10T14:30:00.000Z")).toContain("8");
  });
});
