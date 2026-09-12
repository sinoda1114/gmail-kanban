export const PLAN_LIMITS = {
  free: { maxProjects: 5 },
  pro: { maxProjects: Infinity },
} as const;

export type BillingPlan = keyof typeof PLAN_LIMITS;

export const FREE_PROJECT_LIMIT_MESSAGE = `Free プランの案件数は ${PLAN_LIMITS.free.maxProjects} 件までです。プラン画面から Pro にアップグレードしてください。`;

export const ALREADY_ON_PRO_MESSAGE = "すでに Pro プランです";

export function isProCheckoutBlocked(effectivePlan: BillingPlan): boolean {
  return effectivePlan === "pro";
}

export function isBillingPlan(plan: string): plan is BillingPlan {
  return plan === "free" || plan === "pro";
}

export function effectiveBillingPlan(
  plan: BillingPlan,
  status: string
): BillingPlan {
  return plan === "pro" && status === "active" ? "pro" : "free";
}

export function isProjectLimitError(error: string | undefined): boolean {
  return error === FREE_PROJECT_LIMIT_MESSAGE;
}
