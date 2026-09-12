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

import {
  PLAN_LIMITS,
  canCreateProject,
  getProjectLimitStatus,
} from "@/lib/billing";
import {
  ALREADY_ON_PRO_MESSAGE,
  FREE_PROJECT_LIMIT_MESSAGE,
  PENDING_SUBSCRIPTION_MESSAGE,
  effectiveBillingPlan,
  getProCheckoutBlock,
  isProjectLimitError,
  proCheckoutBlockMessage,
} from "@/lib/billing-limits";

describe("PLAN_LIMITS", () => {
  it("defines free plan project cap", () => {
    expect(PLAN_LIMITS.free.maxProjects).toBe(5);
  });

  it("defines pro plan as unlimited projects", () => {
    expect(PLAN_LIMITS.pro.maxProjects).toBe(Infinity);
  });
});

describe("FREE_PROJECT_LIMIT_MESSAGE", () => {
  it("names the free cap and points to the plan page", () => {
    expect(FREE_PROJECT_LIMIT_MESSAGE).toBe(
      "Free プランの案件数は 5 件までです。プラン画面から Pro にアップグレードしてください。"
    );
    expect(isProjectLimitError(FREE_PROJECT_LIMIT_MESSAGE)).toBe(true);
    expect(isProjectLimitError("Unauthorized")).toBe(false);
  });
});

describe("getProCheckoutBlock", () => {
  it("blocks checkout for an effective Pro plan", () => {
    expect(
      getProCheckoutBlock({
        plan: "pro",
        status: "active",
        stripeSubscriptionId: "sub_test",
      })
    ).toEqual({ blocked: true, reason: "already-pro" });
    expect(proCheckoutBlockMessage("already-pro")).toBe(ALREADY_ON_PRO_MESSAGE);
  });

  it("allows checkout for Free without a subscription", () => {
    expect(
      getProCheckoutBlock({
        plan: "free",
        status: "active",
        stripeSubscriptionId: null,
      })
    ).toEqual({ blocked: false });
  });

  it("blocks Free rows that still have a non-canceled subscription id", () => {
    expect(
      getProCheckoutBlock({
        plan: "free",
        status: "active",
        stripeSubscriptionId: "sub_pending",
      })
    ).toEqual({ blocked: true, reason: "pending-subscription" });
    expect(
      getProCheckoutBlock({
        plan: "pro",
        status: "past_due",
        stripeSubscriptionId: "sub_past_due",
      })
    ).toEqual({ blocked: true, reason: "pending-subscription" });
    expect(proCheckoutBlockMessage("pending-subscription")).toBe(
      PENDING_SUBSCRIPTION_MESSAGE
    );
  });

  it("allows checkout after a canceled subscription", () => {
    expect(
      getProCheckoutBlock({
        plan: "pro",
        status: "canceled",
        stripeSubscriptionId: "sub_old",
      })
    ).toEqual({ blocked: false });
  });
});

describe("effectiveBillingPlan", () => {
  it("keeps active pro as pro", () => {
    expect(effectiveBillingPlan("pro", "active")).toBe("pro");
  });

  it("treats canceled pro as free", () => {
    expect(effectiveBillingPlan("pro", "canceled")).toBe("free");
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
      stripeCustomerId: "cus_test",
    });
    mockWhere.mockResolvedValue([{ value: 12 }]);

    const allowed = await canCreateProject("user-pro");

    expect(allowed).toBe(true);
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
      stripeCustomerId: "cus_test",
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
      stripeCustomerId: null,
    });
    mockWhere.mockResolvedValue([{ value: 3 }]);

    const allowed = await canCreateProject("user-unknown-plan");

    expect(allowed).toBe(true);
  });
});

describe("getProjectLimitStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns free usage against the cap", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockWhere.mockResolvedValue([{ value: 4 }]);

    await expect(getProjectLimitStatus("user-free")).resolves.toEqual({
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      effectivePlan: "free",
      allowed: true,
      currentCount: 4,
      maxProjects: 5,
    });
  });

  it("returns unlimited max for active pro", async () => {
    mockFindFirst.mockResolvedValue({
      plan: "pro",
      status: "active",
      currentPeriodEnd: "2026-09-01T00:00:00.000Z",
      stripeCustomerId: "cus_test",
      stripeSubscriptionId: "sub_test",
    });
    mockWhere.mockResolvedValue([{ value: 12 }]);

    await expect(getProjectLimitStatus("user-pro")).resolves.toEqual({
      plan: "pro",
      status: "active",
      currentPeriodEnd: "2026-09-01T00:00:00.000Z",
      stripeCustomerId: "cus_test",
      stripeSubscriptionId: "sub_test",
      effectivePlan: "pro",
      allowed: true,
      currentCount: 12,
      maxProjects: null,
    });
  });

  it("denies free users at the cap and reports the count", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockWhere.mockResolvedValue([{ value: 5 }]);

    const status = await getProjectLimitStatus("user-free-at-limit");

    expect(status.allowed).toBe(false);
    expect(status.currentCount).toBe(5);
    expect(status.maxProjects).toBe(5);
  });
});
