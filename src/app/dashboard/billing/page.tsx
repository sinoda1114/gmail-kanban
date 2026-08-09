import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Container, Title } from "@mantine/core";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { BillingActions } from "@/components/billing/BillingActions";
import { db } from "@/db/client";
import { billingSubscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  formatProjectLimitDisplay,
  getEffectivePlan,
  getUserBilling,
  getUserProjectCount,
} from "@/lib/billing";

type BillingPageProps = Record<string, never>;

export default async function BillingPage({}: BillingPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  if (!user) redirect("/onboarding");

  const billing = await getUserBilling(user.id);
  const effectivePlan = getEffectivePlan(billing);
  const projectCount = await getUserProjectCount(user.id);
  const projectCountLabel = formatProjectLimitDisplay(effectivePlan, projectCount);

  const billingRecord = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, user.id),
  });

  return (
    <DashboardShell>
      <Container size="lg" py="md">
        <Title order={2} mb="lg">
          課金・プラン
        </Title>
        <BillingActions
          effectivePlan={effectivePlan}
          projectCountLabel={projectCountLabel}
          currentPeriodEnd={billing.currentPeriodEnd}
          hasStripeCustomer={Boolean(billingRecord?.stripeCustomerId)}
        />
      </Container>
    </DashboardShell>
  );
}
