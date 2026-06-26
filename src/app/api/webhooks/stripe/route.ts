import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db/client";
import { billingSubscriptions, users } from "@/db/schema";

let stripeClient: Stripe | null = null;

type SubscriptionStatus = "active" | "canceled" | "past_due";

function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}

function getStripeId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function getSubscriptionId(value: string | Stripe.Subscription | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function normalizeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled") return "canceled";
  return "past_due";
}

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return typeof periodEnd === "number" ? new Date(periodEnd * 1000).toISOString() : null;
}

async function upsertSubscription(input: {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: "free" | "pro";
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}) {
  const now = new Date().toISOString();
  const existing = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, input.userId),
  });

  if (existing) {
    await db
      .update(billingSubscriptions)
      .set({ ...input, updatedAt: now })
      .where(eq(billingSubscriptions.id, existing.id));
    return;
  }

  await db.insert(billingSubscriptions).values({
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  });
}

async function findUserId(subscription: Stripe.Subscription): Promise<string | null> {
  if (subscription.metadata.userId) return subscription.metadata.userId;

  const stripeCustomerId = getStripeId(subscription.customer);
  if (!stripeCustomerId) return null;

  const billing = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.stripeCustomerId, stripeCustomerId),
  });
  return billing?.userId ?? null;
}

async function handleSubscription(subscription: Stripe.Subscription, deleted = false) {
  const userId = await findUserId(subscription);
  if (!userId) return;

  await upsertSubscription({
    userId,
    stripeCustomerId: getStripeId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    plan: deleted ? "free" : "pro",
    status: deleted ? "canceled" : normalizeStatus(subscription.status),
    currentPeriodEnd: getPeriodEnd(subscription),
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const stripeCustomerId = getStripeId(session.customer);
  if (!userId || !stripeCustomerId) return;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;

  const now = new Date().toISOString();
  const existing = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, userId),
  });

  if (existing) {
    await db
      .update(billingSubscriptions)
      .set({
        stripeCustomerId,
        stripeSubscriptionId: getSubscriptionId(session.subscription) ?? existing.stripeSubscriptionId,
        updatedAt: now,
      })
      .where(eq(billingSubscriptions.id, existing.id));
    return;
  }

  await db.insert(billingSubscriptions).values({
    id: randomUUID(),
    userId,
    stripeCustomerId,
    stripeSubscriptionId: getSubscriptionId(session.subscription),
    plan: "free",
    status: "active",
    currentPeriodEnd: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscription(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscription(event.data.object, true);
      break;
  }

  return NextResponse.json({ received: true });
}
