import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindFirst, mockWhere, mockSelect } = vi.hoisted(() => {
  const mockWhere = vi.fn();
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockFindFirst = vi.fn();

  return { mockFindFirst, mockWhere, mockSelect };
});

vi.mock("@/db/client", () => ({
  db: {
    query: {
      billingSubscriptions: {
        findFirst: mockFindFirst,
      },
    },
    select: mockSelect,
  },
}));

import { PLAN_LIMITS, canCreateProject } from "@/lib/billing";

describe("PLAN_LIMITS", () => {
  it("defines free plan project cap", () => {
    expect(PLAN_LIMITS.free.maxProjects).toBe(5);
  });

  it("defines pro plan as unlimited projects", () => {
    expect(PLAN_LIMITS.pro.maxProjects).toBe(Infinity);
  });
});

describe("canCreateProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows pro users with active subscription regardless of project count", async () => {
    mockFindFirst.mockResolvedValue({
      plan: "pro",
      status: "active",
      currentPeriodEnd: "2026-09-01T00:00:00.000Z",
    });

    const allowed = await canCreateProject("user-pro");

    expect(allowed).toBe(true);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("denies free users at the project limit", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockWhere.mockResolvedValue([{ value: 5 }]);

    const allowed = await canCreateProject("user-free-at-limit");

    expect(allowed).toBe(false);
  });

  it("allows free users below the project limit", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockWhere.mockResolvedValue([{ value: 4 }]);

    const allowed = await canCreateProject("user-free-under-limit");

    expect(allowed).toBe(true);
  });

  it("treats inactive pro subscriptions as free limits", async () => {
    mockFindFirst.mockResolvedValue({
      plan: "pro",
      status: "canceled",
      currentPeriodEnd: "2026-08-01T00:00:00.000Z",
    });
    mockWhere.mockResolvedValue([{ value: 5 }]);

    const allowed = await canCreateProject("user-pro-inactive");

    expect(allowed).toBe(false);
  });

  it("treats unknown billing plans as free limits", async () => {
    mockFindFirst.mockResolvedValue({
      plan: "enterprise",
      status: "active",
      currentPeriodEnd: null,
    });
    mockWhere.mockResolvedValue([{ value: 3 }]);

    const allowed = await canCreateProject("user-unknown-plan");

    expect(allowed).toBe(true);
  });
});
