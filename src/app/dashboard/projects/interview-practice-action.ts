"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import {
  users,
  projects,
  interviewPreparations,
  interviewQuestions,
  interviewResearchPacks,
  interviewPracticeSessions,
  aiExtractionLogs,
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
  GEMINI_RESEARCH_MODEL_ID,
  GEMINI_LIVE_MODEL_ID,
  GEMINI_JSON_PROVIDER_OPTIONS,
} from "@/lib/ai-model";
import {
  PracticeTurnAiSchema,
  PracticeMessageSchema,
  type PracticeMessage,
  type PracticeTurn,
  normalizePracticeTurn,
  PRACTICE_ENDED_MESSAGE,
  PRACTICE_STALE_MESSAGE,
  PRACTICE_FALLBACK_FEEDBACK,
  MAX_PRACTICE_MESSAGE_CHARS,
  canSubmitPracticeReply,
  coercePracticeWrapUp,
  shouldWrapUpPractice,
} from "@/types/interview-practice";
import { RehearsalFeedbackSchema, type RehearsalFeedback } from "@/types/interview-prep";
import { parseStoredResearchPack } from "@/lib/interview-research";
import {
  buildPracticeTurnPrompt,
  buildLivePracticePrompt,
  buildLiveFeedbackPrompt,
} from "@/lib/interview-practice";
import { clipPracticeTranscript } from "@/lib/practice-speech";
import type { LiveConnectSetup } from "@/lib/practice-live";
import { mintLiveEphemeralToken, liveSetupFromInstruction } from "@/lib/practice-live-token";
import { z } from "zod";

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

function logAiFailure(taskType: string, error: unknown) {
  console.error(`${taskType} failed`, {
    taskType,
    message: error instanceof Error ? error.message : "unknown error",
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

async function generateTurn(input: {
  project: {
    title: string;
    techStack: string[] | null;
    summary: string | null;
  };
  careerMemo: string | null;
  research: ReturnType<typeof parseStoredResearchPack>;
  prepQuestions: string[];
  messages: PracticeMessage[];
}): Promise<PracticeTurn> {
  const prompt = buildPracticeTurnPrompt(input);
  const { object } = await generateObject({
    model: google(GEMINI_RESEARCH_MODEL_ID),
    schema: PracticeTurnAiSchema,
    providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
    prompt,
  });
  const turn = coercePracticeWrapUp(
    normalizePracticeTurn(object),
    input.messages
  );
  return turn;
}

export async function startInterviewPractice(projectId: string): Promise<{
  success: boolean;
  error?: string;
  sessionId?: string;
}> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const ctx = await loadPracticeContext(projectId, user.id);
  if (!ctx) return { success: false, error: "Project not found" };

  try {
    const turn = await generateTurn({
      ...ctx,
      messages: [],
    });
    const messages: PracticeMessage[] = [
      { role: "interviewer", content: turn.message },
    ];
    const sessionId = randomUUID();
    const completed = turn.kind === "wrap_up";
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx
        .update(interviewPracticeSessions)
        .set({ status: "completed" })
        .where(
          and(
            eq(interviewPracticeSessions.projectId, projectId),
            eq(interviewPracticeSessions.userId, user.id),
            eq(interviewPracticeSessions.status, "active")
          )
        );

      await tx.insert(interviewPracticeSessions).values({
        id: sessionId,
        projectId,
        userId: user.id,
        status: completed ? "completed" : "active",
        messages,
        feedback: completed && turn.kind === "wrap_up" ? turn.feedback : null,
        model: GEMINI_RESEARCH_MODEL_ID,
        createdAt: now,
        updatedAt: now,
      });
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      taskType: "interview_practice",
      model: GEMINI_RESEARCH_MODEL_ID,
      createdAt: now,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, sessionId };
  } catch (error) {
    logAiFailure("interview_practice_start", error);
    return { success: false, error: "AI処理に失敗しました" };
  }
}

export async function submitPracticeReply(
  sessionId: string,
  answer: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const trimmed = answer.trim();
  if (!trimmed) return { success: false, error: "回答を入力してください" };
  if (trimmed.length > MAX_PRACTICE_MESSAGE_CHARS) {
    return {
      success: false,
      error: `回答は${MAX_PRACTICE_MESSAGE_CHARS}文字以内にしてください`,
    };
  }

  const session = await db.query.interviewPracticeSessions.findFirst({
    where: eq(interviewPracticeSessions.id, sessionId),
  });
  if (!session) return { success: false, error: "セッションが見つかりません" };
  if (session.userId !== user.id) return { success: false, error: "Unauthorized" };
  if (!canSubmitPracticeReply(session.status)) {
    return { success: false, error: PRACTICE_ENDED_MESSAGE };
  }

  const ctx = await loadPracticeContext(session.projectId, user.id);
  if (!ctx) return { success: false, error: "Unauthorized" };

  const messages: PracticeMessage[] = [
    ...session.messages,
    { role: "candidate", content: trimmed },
  ];
  const now = new Date().toISOString();

  try {
    const turn = await generateTurn({ ...ctx, messages });
    const nextMessages: PracticeMessage[] = [
      ...messages,
      { role: "interviewer", content: turn.message },
    ];
    const feedback: RehearsalFeedback | null =
      turn.kind === "wrap_up" ? turn.feedback : null;

    const updated = await db
      .update(interviewPracticeSessions)
      .set({
        messages: nextMessages,
        status: turn.kind === "wrap_up" ? "completed" : "active",
        feedback,
        updatedAt: now,
      })
      .where(
        and(
          eq(interviewPracticeSessions.id, sessionId),
          eq(interviewPracticeSessions.status, "active"),
          eq(interviewPracticeSessions.updatedAt, session.updatedAt)
        )
      )
      .returning({ id: interviewPracticeSessions.id });

    if (updated.length === 0) {
      return { success: false, error: PRACTICE_STALE_MESSAGE };
    }

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId: session.projectId,
      taskType: "interview_practice",
      model: GEMINI_RESEARCH_MODEL_ID,
      createdAt: now,
    });

    revalidatePath(`/dashboard/projects/${session.projectId}`);
    return { success: true };
  } catch (error) {
    logAiFailure("interview_practice_reply", error);
    return { success: false, error: "AI処理に失敗しました" };
  }
}

const LiveMessagesSchema = z.array(PracticeMessageSchema).max(40);

async function completeActiveSessions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  projectId: string,
  userId: string
) {
  await tx
    .update(interviewPracticeSessions)
    .set({ status: "completed" })
    .where(
      and(
        eq(interviewPracticeSessions.projectId, projectId),
        eq(interviewPracticeSessions.userId, userId),
        eq(interviewPracticeSessions.status, "active")
      )
    );
}

export async function startLiveInterviewPractice(projectId: string): Promise<{
  success: boolean;
  error?: string;
  sessionId?: string;
  token?: string;
  setup?: LiveConnectSetup;
}> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const ctx = await loadPracticeContext(projectId, user.id);
  if (!ctx) return { success: false, error: "Project not found" };

  const setup = liveSetupFromInstruction(buildLivePracticePrompt(ctx));
  try {
    const token = await mintLiveEphemeralToken(setup);
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      await completeActiveSessions(tx, projectId, user.id);
      await tx.insert(interviewPracticeSessions).values({
        id: sessionId,
        projectId,
        userId: user.id,
        status: "active",
        messages: [],
        feedback: null,
        model: GEMINI_LIVE_MODEL_ID,
        createdAt: now,
        updatedAt: now,
      });
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      taskType: "interview_practice_live",
      model: GEMINI_LIVE_MODEL_ID,
      createdAt: now,
    });

    return { success: true, sessionId, token, setup };
  } catch (error) {
    logAiFailure("interview_practice_live_start", error);
    return { success: false, error: "ライブ面談を開始できませんでした" };
  }
}

function sanitizeLiveMessages(raw: unknown): PracticeMessage[] | null {
  const parsed = LiveMessagesSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.map((message) => ({
    role: message.role,
    content: clipPracticeTranscript(message.content, MAX_PRACTICE_MESSAGE_CHARS),
  }));
}

export async function savePracticeStreamedReply(
  sessionId: string,
  userAnswer: string,
  aiResponse: string
): Promise<{ success: boolean; error?: string; completed?: boolean }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const trimmedAnswer = userAnswer.trim();
  const trimmedAi = aiResponse.trim();
  if (!trimmedAnswer || !trimmedAi) {
    return { success: false, error: "回答が空です" };
  }

  const session = await db.query.interviewPracticeSessions.findFirst({
    where: eq(interviewPracticeSessions.id, sessionId),
  });
  if (!session) return { success: false, error: "セッションが見つかりません" };
  if (session.userId !== user.id) return { success: false, error: "Unauthorized" };
  if (!canSubmitPracticeReply(session.status)) {
    return { success: false, error: PRACTICE_ENDED_MESSAGE };
  }

  const nextMessages: PracticeMessage[] = [
    ...session.messages,
    { role: "candidate", content: trimmedAnswer },
    { role: "interviewer", content: trimmedAi },
  ];

  const shouldComplete = shouldWrapUpPractice(nextMessages);
  const now = new Date().toISOString();

  let feedback: RehearsalFeedback | null = null;
  if (shouldComplete) {
    try {
      const { object } = await generateObject({
        model: google(GEMINI_RESEARCH_MODEL_ID),
        schema: RehearsalFeedbackSchema,
        providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
        prompt: buildLiveFeedbackPrompt(nextMessages),
      });
      feedback = object;
    } catch (error) {
      logAiFailure("interview_practice_streamed_feedback", error);
      feedback = PRACTICE_FALLBACK_FEEDBACK;
    }
  }

  const updated = await db
    .update(interviewPracticeSessions)
    .set({
      messages: nextMessages,
      status: shouldComplete ? "completed" : "active",
      feedback,
      updatedAt: now,
    })
    .where(
      and(
        eq(interviewPracticeSessions.id, sessionId),
        eq(interviewPracticeSessions.status, "active"),
        eq(interviewPracticeSessions.updatedAt, session.updatedAt)
      )
    )
    .returning({ id: interviewPracticeSessions.id });

  if (updated.length === 0) {
    return { success: false, error: PRACTICE_STALE_MESSAGE };
  }

  await db.insert(aiExtractionLogs).values({
    id: randomUUID(),
    userId: user.id,
    projectId: session.projectId,
    taskType: "interview_practice",
    model: GEMINI_RESEARCH_MODEL_ID,
    createdAt: now,
  });

  revalidatePath(`/dashboard/projects/${session.projectId}`);
  return { success: true, completed: shouldComplete };
}

export async function finishLiveInterviewPractice(
  sessionId: string,
  rawMessages: unknown
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const messages = sanitizeLiveMessages(rawMessages);
  if (!messages) return { success: false, error: "対話の保存に失敗しました" };

  const session = await db.query.interviewPracticeSessions.findFirst({
    where: eq(interviewPracticeSessions.id, sessionId),
  });
  if (!session) return { success: false, error: "セッションが見つかりません" };
  if (session.userId !== user.id) return { success: false, error: "Unauthorized" };
  if (!canSubmitPracticeReply(session.status)) {
    return { success: false, error: PRACTICE_ENDED_MESSAGE };
  }

  const now = new Date().toISOString();
  let feedback: RehearsalFeedback = PRACTICE_FALLBACK_FEEDBACK;
  try {
    if (messages.length > 0) {
      const { object } = await generateObject({
        model: google(GEMINI_RESEARCH_MODEL_ID),
        schema: RehearsalFeedbackSchema,
        providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
        prompt: buildLiveFeedbackPrompt(messages),
      });
      feedback = object;
    }
  } catch (error) {
    logAiFailure("interview_practice_live_feedback", error);
  }

  const updated = await db
    .update(interviewPracticeSessions)
    .set({
      messages,
      status: "completed",
      feedback,
      updatedAt: now,
    })
    .where(
      and(
        eq(interviewPracticeSessions.id, sessionId),
        eq(interviewPracticeSessions.status, "active")
      )
    )
    .returning({ id: interviewPracticeSessions.id });

  if (updated.length === 0) {
    return { success: false, error: PRACTICE_STALE_MESSAGE };
  }

  await db.insert(aiExtractionLogs).values({
    id: randomUUID(),
    userId: user.id,
    projectId: session.projectId,
    taskType: "interview_practice_live_feedback",
    model: GEMINI_RESEARCH_MODEL_ID,
    createdAt: now,
  });

  revalidatePath(`/dashboard/projects/${session.projectId}`);
  return { success: true };
}
