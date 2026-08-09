"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import { users, projects, interviewNotes, aiExtractionLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { GEMINI_MODEL_ID } from "@/lib/ai-model";
import {
  InterviewRetrospectiveSchema,
  type InterviewRetrospective,
} from "@/types/retrospective";

const EMPTY_NOTES_MESSAGE =
  "面談メモが空です。面談中・面談後メモ、印象、懸念点などを入力してから振り返りを生成してください。";

const TEMPERATURE_LABELS: Record<string, string> = {
  very_positive: "◎ かなり前向き",
  positive: "○ 前向き",
  neutral: "△ 中立",
  negative: "× あまり前向きでない",
};

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

function noteHasContent(
  note: {
    duringNote?: string | null;
    afterNote?: string | null;
    impression?: string | null;
    ownTemperature?: string | null;
    concern?: string | null;
    nextAction?: string | null;
  } | null
): boolean {
  if (!note) return false;
  return [
    note.duringNote,
    note.afterNote,
    note.impression,
    note.concern,
    note.nextAction,
    note.ownTemperature,
  ].some((v) => v?.trim());
}

export type RetrospectiveNoteInput = {
  duringNote?: string;
  afterNote?: string;
  impression?: string;
  ownTemperature?: string;
  concern?: string;
  nextAction?: string;
};

function mergeNoteContent(
  saved: {
    duringNote?: string | null;
    afterNote?: string | null;
    impression?: string | null;
    ownTemperature?: string | null;
    concern?: string | null;
    nextAction?: string | null;
  } | null,
  input?: RetrospectiveNoteInput
) {
  return {
    duringNote: input?.duringNote ?? saved?.duringNote ?? "",
    afterNote: input?.afterNote ?? saved?.afterNote ?? "",
    impression: input?.impression ?? saved?.impression ?? "",
    ownTemperature: input?.ownTemperature ?? saved?.ownTemperature ?? "",
    concern: input?.concern ?? saved?.concern ?? "",
    nextAction: input?.nextAction ?? saved?.nextAction ?? "",
  };
}

export async function generateRetrospective(
  projectId: string,
  noteInput?: RetrospectiveNoteInput
): Promise<{
  success: boolean;
  retrospective?: InterviewRetrospective;
  error?: string;
}> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const note = await db.query.interviewNotes.findFirst({
    where: and(
      eq(interviewNotes.projectId, projectId),
      eq(interviewNotes.userId, user.id)
    ),
  });

  const merged = mergeNoteContent(note ?? null, noteInput);

  if (!noteHasContent(merged)) {
    return { success: false, error: EMPTY_NOTES_MESSAGE };
  }

  const modelId = GEMINI_MODEL_ID;
  const techStack = Array.isArray(project.techStack)
    ? project.techStack.join(", ")
    : "（記載なし）";

  const temperatureLabel = merged.ownTemperature
    ? (TEMPERATURE_LABELS[merged.ownTemperature] ?? merged.ownTemperature)
    : "（未入力）";

  const prompt = `
フリーランスエンジニアの面談後振り返りを作成してください。
入力された面談メモのみを根拠にし、メモに書かれていない事実は推測で補わないでください。
メモが薄い場合は、無理に具体化せず「メモが不足しているため判断できない」旨を簡潔に書いてください。

案件タイトル: ${project.title}
技術スタック: ${techStack}
案件サマリー: ${project.summary || "（なし）"}

面談中メモ:
${merged.duringNote.trim() || "（なし）"}

面談後メモ:
${merged.afterNote.trim() || "（なし）"}

先方の印象:
${merged.impression.trim() || "（なし）"}

自分の温度感: ${temperatureLabel}

懸念点:
${merged.concern.trim() || "（なし）"}

次アクション:
${merged.nextAction.trim() || "（なし）"}

以下を生成してください:
1. wentWell: うまくいったこと・良かった点（箇条書き可）
2. likelyFollowUps: 想定されるフォローアップ・確認事項
3. temperatureAssessment: 案件・面談の温度感の整理（メモの温度感も踏まえる）
4. nextPrepTips: 次回面談に向けた準備のヒント（この案件・技術スタック向けに具体的に）
  `.trim();

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: InterviewRetrospectiveSchema,
      prompt,
    });

    const now = new Date().toISOString();

    const noteFields = {
      duringNote: merged.duringNote,
      afterNote: merged.afterNote,
      impression: merged.impression,
      ownTemperature: merged.ownTemperature,
      concern: merged.concern,
      nextAction: merged.nextAction,
      retrospective: object,
      updatedAt: now,
    };

    if (note) {
      await db
        .update(interviewNotes)
        .set(noteFields)
        .where(eq(interviewNotes.id, note.id));
    } else {
      await db.insert(interviewNotes).values({
        id: randomUUID(),
        projectId,
        userId: user.id,
        ...noteFields,
        createdAt: now,
      });
    }

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      taskType: "interview_retrospective",
      model: modelId,
      createdAt: now,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, retrospective: object };
  } catch (error) {
    console.error("interview_retrospective failed", {
      projectId,
      taskType: "interview_retrospective",
      message: error instanceof Error ? error.message : "unknown error",
    });
    return { success: false, error: "AI処理に失敗しました" };
  }
}

export async function saveRetrospective(
  projectId: string,
  retrospective: InterviewRetrospective
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const parsed = InterviewRetrospectiveSchema.safeParse(retrospective);
  if (!parsed.success) {
    return { success: false, error: "Invalid retrospective data" };
  }

  const now = new Date().toISOString();
  const existing = await db.query.interviewNotes.findFirst({
    where: and(
      eq(interviewNotes.projectId, projectId),
      eq(interviewNotes.userId, user.id)
    ),
  });

  if (existing) {
    await db
      .update(interviewNotes)
      .set({ retrospective: parsed.data, updatedAt: now })
      .where(eq(interviewNotes.id, existing.id));
  } else {
    await db.insert(interviewNotes).values({
      id: randomUUID(),
      projectId,
      userId: user.id,
      retrospective: parsed.data,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}
