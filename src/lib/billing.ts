import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { billingSubscriptions, projects } from "@/db/schema";

export const PLAN_LIMITS = {
  free: { maxProjects: 5 },
  pro: { maxProjects: Infinity },
} as const;

type BillingPlan = keyof typeof PLAN_LIMITS;

type UserBilling = {
  plan: BillingPlan;
  status: string;
  currentPeriodEnd: string | null;
};

function isBillingPlan(plan: string): plan is BillingPlan {
  return plan === "free" || plan === "pro";
}

export async function getUserBilling(userId: string): Promise<UserBilling> {
  const billing = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, userId),
  });

  if (!billing || !isBillingPlan(billing.plan)) {
    return { plan: "free", status: "active", currentPeriodEnd: null };
  }

  return {
    plan: billing.plan,
    status: billing.status,
    currentPeriodEnd: billing.currentPeriodEnd,
  };
}

export async function canCreateProject(userId: string): Promise<boolean> {
  const billing = await getUserBilling(userId);
  const plan = billing.plan === "pro" && billing.status === "active" ? "pro" : "free";
  const limit = PLAN_LIMITS[plan].maxProjects;
  if (limit === Infinity) return true;

  const [result] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  return (result?.value ?? 0) < limit;
}
