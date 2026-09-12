import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { billingSubscriptions, projects } from "@/db/schema";
import {
  PLAN_LIMITS,
  effectiveBillingPlan,
  isBillingPlan,
  type BillingPlan,
} from "@/lib/billing-limits";

export {
  PLAN_LIMITS,
  FREE_PROJECT_LIMIT_MESSAGE,
  ALREADY_ON_PRO_MESSAGE,
  PENDING_SUBSCRIPTION_MESSAGE,
  effectiveBillingPlan,
  getProCheckoutBlock,
  isBillingPlan,
  isProjectLimitError,
  proCheckoutBlockMessage,
} from "@/lib/billing-limits";
export type { BillingPlan } from "@/lib/billing-limits";

export type UserBilling = {
  plan: BillingPlan;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type ProjectLimitStatus = {
  plan: BillingPlan;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  effectivePlan: BillingPlan;
  allowed: boolean;
  currentCount: number;
  maxProjects: number | null;
};

export async function getUserBilling(userId: string): Promise<UserBilling> {
  const billing = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, userId),
  });

  if (!billing || !isBillingPlan(billing.plan)) {
    return {
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      stripeCustomerId: billing?.stripeCustomerId ?? null,
      stripeSubscriptionId: billing?.stripeSubscriptionId ?? null,
    };
  }

  return {
    plan: billing.plan,
    status: billing.status,
    currentPeriodEnd: billing.currentPeriodEnd,
    stripeCustomerId: billing.stripeCustomerId,
    stripeSubscriptionId: billing.stripeSubscriptionId,
  };
}

export async function getProjectLimitStatus(
  userId: string
): Promise<ProjectLimitStatus> {
  const billing = await getUserBilling(userId);
  const effectivePlan = effectiveBillingPlan(billing.plan, billing.status);
  const limit = PLAN_LIMITS[effectivePlan].maxProjects;

  const [result] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.userId, userId));
  const currentCount = result?.value ?? 0;

  return {
    ...billing,
    effectivePlan,
    allowed: limit === Infinity || currentCount < limit,
    currentCount,
    maxProjects: limit === Infinity ? null : limit,
  };
}

export async function canCreateProject(userId: string): Promise<boolean> {
  const status = await getProjectLimitStatus(userId);
  return status.allowed;
}
