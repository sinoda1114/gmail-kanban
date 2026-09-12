export const PLAN_LIMITS = {
  free: { maxProjects: 5 },
  pro: { maxProjects: Infinity },
} as const;

export type BillingPlan = keyof typeof PLAN_LIMITS;

export const FREE_PROJECT_LIMIT_MESSAGE = `Free プランの案件数は ${PLAN_LIMITS.free.maxProjects} 件までです。プラン画面から Pro にアップグレードしてください。`;

export const ALREADY_ON_PRO_MESSAGE = "すでに Pro プランです";

export const PENDING_SUBSCRIPTION_MESSAGE =
  "アップグレードの処理中か、お支払いの更新が必要です。ページを再読み込みするか「お支払いを管理」を使ってください。";

export type ProCheckoutBlockReason = "already-pro" | "pending-subscription";

export function isBillingPlan(plan: string): plan is BillingPlan {
  return plan === "free" || plan === "pro";
}

export function effectiveBillingPlan(
  plan: BillingPlan,
  status: string
): BillingPlan {
  return plan === "pro" && status === "active" ? "pro" : "free";
}

export function getProCheckoutBlock(input: {
  plan: string;
  status: string;
  stripeSubscriptionId: string | null;
}): { blocked: false } | { blocked: true; reason: ProCheckoutBlockReason } {
  const plan = isBillingPlan(input.plan) ? input.plan : "free";
  if (effectiveBillingPlan(plan, input.status) === "pro") {
    return { blocked: true, reason: "already-pro" };
  }
  if (input.stripeSubscriptionId && input.status !== "canceled") {
    return { blocked: true, reason: "pending-subscription" };
  }
  return { blocked: false };
}

export function proCheckoutBlockMessage(
  reason: ProCheckoutBlockReason
): string {
  return reason === "already-pro"
    ? ALREADY_ON_PRO_MESSAGE
    : PENDING_SUBSCRIPTION_MESSAGE;
}

export function isProjectLimitError(error: string | undefined): boolean {
  return error === FREE_PROJECT_LIMIT_MESSAGE;
}
