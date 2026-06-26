"use server";

import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db/client";
import { billingSubscriptions, users } from "@/db/schema";

let stripeClient: Stripe | null = null;

type CheckoutResult = { success: true; url: string } | { success: false; error: string };

function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}

async function getAuthedUser() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  return user ?? null;
}

async function getOrCreateBilling(userId: string, email: string, name: string) {
  const existing = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, userId),
  });
  if (existing?.stripeCustomerId) return existing;

  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { userId },
  });
  const now = new Date().toISOString();

  if (existing) {
    await db
      .update(billingSubscriptions)
      .set({ stripeCustomerId: customer.id, updatedAt: now })
      .where(eq(billingSubscriptions.id, existing.id));
    return { ...existing, stripeCustomerId: customer.id };
  }

  const billing = {
    id: randomUUID(),
    userId,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: null,
    plan: "free",
    status: "active",
    currentPeriodEnd: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(billingSubscriptions).values(billing);
  return billing;
}

export async function createCheckoutSession(): Promise<CheckoutResult> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!priceId || !siteUrl) {
    return { success: false, error: "Billing is not configured" };
  }

  try {
    const billing = await getOrCreateBilling(user.id, user.email, user.name);
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: billing.stripeCustomerId ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/billing?success=true`,
      cancel_url: `${siteUrl}/dashboard/billing`,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
    });

    if (!session.url) return { success: false, error: "Checkout URL was not created" };
    return { success: true, url: session.url };
  } catch {
    return { success: false, error: "Failed to create checkout session" };
  }
}
