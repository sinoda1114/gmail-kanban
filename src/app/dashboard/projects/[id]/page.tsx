import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db/client";
import { projects, projectStatusHistory, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AppShell, Container } from "@mantine/core";
import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (!user) redirect("/onboarding");

  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) notFound();

  const history = await db
    .select()
    .from(projectStatusHistory)
    .where(eq(projectStatusHistory.projectId, id))
    .orderBy(desc(projectStatusHistory.changedAt))
    .limit(20);

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg" py="md">
          <ProjectDetailView project={project} statusHistory={history} />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
