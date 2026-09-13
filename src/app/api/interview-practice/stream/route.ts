import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import {
  users,
  projects,
  interviewPreparations,
  interviewQuestions,
  interviewResearchPacks,
  interviewPracticeSessions,
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { GEMINI_RESEARCH_MODEL_ID } from "@/lib/ai-model";
import { parseStoredResearchPack } from "@/lib/interview-research";
import { buildPracticeStreamPrompt } from "@/lib/interview-practice";
import type { PracticeMessage } from "@/types/interview-practice";
import { MAX_PRACTICE_MESSAGE_CHARS } from "@/types/interview-practice";

async function getAuthedUser() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  return user ?? null;
}

async function getOwnedProject(projectId: string, userId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });
}

async function loadPracticeContext(projectId: string, userId: string) {
  const [project, prep, researchRow] = await Promise.all([
    getOwnedProject(projectId, userId),
    db.query.interviewPreparations.findFirst({
      where: and(
        eq(interviewPreparations.projectId, projectId),
        eq(interviewPreparations.userId, userId)
      ),
    }),
    db.query.interviewResearchPacks.findFirst({
      where: and(
        eq(interviewResearchPacks.projectId, projectId),
        eq(interviewResearchPacks.userId, userId)
      ),
      orderBy: desc(interviewResearchPacks.updatedAt),
    }),
  ]);
  if (!project) return null;

  const prepQuestions = prep
    ? (
        await db
          .select({
            question: interviewQuestions.question,
            priority: interviewQuestions.priority,
          })
          .from(interviewQuestions)
          .where(eq(interviewQuestions.preparationId, prep.id))
          .orderBy(asc(interviewQuestions.sortOrder))
      )
        .sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high"))
        .map((q) => q.question)
    : [];

  return {
    project,
    careerMemo: prep?.careerMemo ?? null,
    research: parseStoredResearchPack(researchRow?.pack),
    prepQuestions,
  };
}

export async function POST(request: Request) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { sessionId, messages } = body as {
      sessionId: string;
      messages: PracticeMessage[];
    };

    if (!sessionId || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await db.query.interviewPracticeSessions.findFirst({
      where: eq(interviewPracticeSessions.id, sessionId),
    });

    if (!session || session.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (session.status !== "active") {
      return new Response(JSON.stringify({ error: "Session not active" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ctx = await loadPracticeContext(session.projectId, user.id);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = buildPracticeStreamPrompt({
      ...ctx,
      messages,
    });

    const result = streamText({
      model: google(GEMINI_RESEARCH_MODEL_ID),
      prompt,
      maxTokens: MAX_PRACTICE_MESSAGE_CHARS * 2,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({ error: "AI処理に失敗しました" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
