import { describe, it, expect } from "vitest";
import {
  canAddProject,
  formatProjectLimitDisplay,
  getEffectivePlan,
  getProjectLimit,
  PLAN_LIMITS,
  PROJECT_LIMIT_REACHED_ERROR,
} from "../billing";

describe("billing plan limits", () => {
  it("PLAN_LIMITS defines free cap and unlimited pro", () => {
    expect(PLAN_LIMITS.free.maxProjects).toBe(5);
    expect(PLAN_LIMITS.pro.maxProjects).toBe(Infinity);
  });

  describe("getEffectivePlan", () => {
    it("treats active pro as pro", () => {
      expect(
        getEffectivePlan({ plan: "pro", status: "active", currentPeriodEnd: null })
      ).toBe("pro");
    });

    it("downgrades canceled pro to free limits", () => {
      expect(
        getEffectivePlan({ plan: "pro", status: "canceled", currentPeriodEnd: null })
      ).toBe("free");
    });

    it("downgrades past_due pro to free limits", () => {
      expect(
        getEffectivePlan({ plan: "pro", status: "past_due", currentPeriodEnd: null })
      ).toBe("free");
    });

    it("keeps free plan as free", () => {
      expect(
        getEffectivePlan({ plan: "free", status: "active", currentPeriodEnd: null })
      ).toBe("free");
    });
  });

  describe("canAddProject", () => {
    it("allows projects under free limit", () => {
      expect(canAddProject(0, "free")).toBe(true);
      expect(canAddProject(4, "free")).toBe(true);
    });

    it("blocks at free limit", () => {
      expect(canAddProject(5, "free")).toBe(false);
      expect(canAddProject(10, "free")).toBe(false);
    });

    it("allows unlimited projects on pro", () => {
      expect(canAddProject(5, "pro")).toBe(true);
      expect(canAddProject(100, "pro")).toBe(true);
    });
  });

  describe("getProjectLimit", () => {
    it("returns numeric cap for free and Infinity for pro", () => {
      expect(getProjectLimit("free")).toBe(5);
      expect(getProjectLimit("pro")).toBe(Infinity);
    });
  });

  describe("formatProjectLimitDisplay", () => {
    it("shows count vs cap on free", () => {
      expect(formatProjectLimitDisplay("free", 3)).toBe("3 / 5 件");
      expect(formatProjectLimitDisplay("free", 5)).toBe("5 / 5 件");
    });

    it("shows unlimited label on pro", () => {
      expect(formatProjectLimitDisplay("pro", 12)).toBe("12 件（無制限）");
    });
  });

  it("PROJECT_LIMIT_REACHED_ERROR is a clear Japanese message", () => {
    expect(PROJECT_LIMIT_REACHED_ERROR).toContain("5件");
    expect(PROJECT_LIMIT_REACHED_ERROR).toContain("Pro");
  });
});
