import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { billingSubscriptions, projects } from "@/db/schema";

export const PLAN_LIMITS = {
  free: { maxProjects: 5 },
  pro: { maxProjects: Infinity },
} as const;

export type BillingPlan = keyof typeof PLAN_LIMITS;

export type UserBilling = {
  plan: BillingPlan;
  status: string;
  currentPeriodEnd: string | null;
};

export const PROJECT_LIMIT_REACHED_ERROR =
  "無料プランでは案件は5件までです。Proプランにアップグレードすると無制限に登録できます。";

export const PLAN_LABELS: Record<BillingPlan, string> = {
  free: "Free",
  pro: "Pro",
};

function isBillingPlan(plan: string): plan is BillingPlan {
  return plan === "free" || plan === "pro";
}

/** Pro benefits apply only when subscription is active (not canceled / past_due). */
export function getEffectivePlan(billing: UserBilling): BillingPlan {
  return billing.plan === "pro" && billing.status === "active" ? "pro" : "free";
}

export function getProjectLimit(plan: BillingPlan): number {
  return PLAN_LIMITS[plan].maxProjects;
}

export function canAddProject(projectCount: number, plan: BillingPlan): boolean {
  const limit = getProjectLimit(plan);
  if (limit === Infinity) return true;
  return projectCount < limit;
}

export function formatProjectLimitDisplay(plan: BillingPlan, projectCount: number): string {
  const limit = getProjectLimit(plan);
  if (limit === Infinity) return `${projectCount} 件（無制限）`;
  return `${projectCount} / ${limit} 件`;
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

export async function getUserProjectCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  return result?.value ?? 0;
}

export async function canCreateProject(userId: string): Promise<boolean> {
  const billing = await getUserBilling(userId);
  const plan = getEffectivePlan(billing);
  const projectCount = await getUserProjectCount(userId);
  return canAddProject(projectCount, plan);
}
