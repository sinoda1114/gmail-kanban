import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db/client";
import {
  projects,
  projectStatusHistory,
  users,
  interviewPreparations,
  interviewQuestions,
  interviewAnswers,
  interviewReverseQuestions,
  interviewNotes,
} from "@/db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
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

  const [history, prep, note] = await Promise.all([
    db
      .select()
      .from(projectStatusHistory)
      .where(eq(projectStatusHistory.projectId, id))
      .orderBy(desc(projectStatusHistory.changedAt))
      .limit(20),
    db.query.interviewPreparations.findFirst({
      where: and(
        eq(interviewPreparations.projectId, id),
        eq(interviewPreparations.userId, user.id)
      ),
    }),
    db.query.interviewNotes.findFirst({
      where: and(
        eq(interviewNotes.projectId, id),
        eq(interviewNotes.userId, user.id)
      ),
    }),
  ]);

  let questionsWithAnswers: {
    id: string;
    preparationId: string | null;
    projectId: string;
    question: string;
    category: string | null;
    priority: string | null;
    memo: string | null;
    sortOrder: number;
    createdAt: string;
    answer: { id: string; questionId: string; aiAnswer: string | null; userAnswer: string | null; createdAt: string; updatedAt: string } | null;
  }[] = [];
  let reverseQs: typeof interviewReverseQuestions.$inferSelect[] = [];

  if (prep) {
    const qs = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.preparationId, prep.id))
      .orderBy(asc(interviewQuestions.sortOrder));

    const answers =
      qs.length > 0
        ? await db
            .select()
            .from(interviewAnswers)
            .where(inArray(interviewAnswers.questionId, qs.map((q) => q.id)))
        : [];

    const answerMap = new Map(answers.map((a) => [a.questionId, a]));
    questionsWithAnswers = qs.map((q) => ({
      ...q,
      answer: answerMap.get(q.id) ?? null,
    }));

    reverseQs = await db
      .select()
      .from(interviewReverseQuestions)
      .where(eq(interviewReverseQuestions.preparationId, prep.id))
      .orderBy(asc(interviewReverseQuestions.sortOrder));
  }

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg" py="md">
          <ProjectDetailView
            project={project}
            statusHistory={history}
            interviewPrep={prep ?? null}
            interviewQuestions={questionsWithAnswers}
            reverseQuestions={reverseQs}
            interviewNote={note ?? null}
          />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
