"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import {
  users,
  projects,
  interviewQuestions,
  interviewAnswers,
  aiExtractionLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  RehearsalFeedbackSchema,
  type RehearsalFeedback,
} from "@/types/interview-prep";

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

export async function getRehearsalFeedback(
  questionId: string,
  userAnswer: string
): Promise<{
  success: boolean;
  feedback?: RehearsalFeedback;
  error?: string;
}> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const trimmed = userAnswer.trim();
  if (!trimmed) {
    return { success: false, error: "回答を入力してください" };
  }

  const question = await db.query.interviewQuestions.findFirst({
    where: eq(interviewQuestions.id, questionId),
  });
  if (!question) return { success: false, error: "質問が見つかりません" };

  const project = await getOwnedProject(question.projectId, user.id);
  if (!project) return { success: false, error: "Unauthorized" };

  const answerRow = await db.query.interviewAnswers.findFirst({
    where: eq(interviewAnswers.questionId, questionId),
  });

  const modelId = "gemini-3.1-flash-lite";
  const techStack = Array.isArray(project.techStack)
    ? project.techStack.join(", ")
    : "";

  const prompt = `
フリーランスエンジニアの面談リハーサル回答にフィードバックしてください。テキストのみ。音声は不要です。

## 質問
${question.question}

## 案件コンテキスト（参考）
タイトル: ${project.title}
技術スタック: ${techStack || "（記載なし）"}

## ユーザーの回答
${trimmed}

## AI回答案（比較参考・正解ではない）
${answerRow?.aiAnswer ?? "（なし）"}

## 評価観点
1. specificity: 具体性（数値・事例・技術名の有無、曖昧な表現の指摘）
2. length: 長さと構成（面談で話すのに適切か、冗長/短すぎないか）
3. weaknesses: 改善すべき弱点を箇条書き（最大5件）
4. summary: 総合コメント（1〜2文、励ましつつ要点）

厳しすぎず、実用的なアドバイスにしてください。
  `.trim();

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: RehearsalFeedbackSchema,
      prompt,
    });

    const now = new Date().toISOString();
    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId: question.projectId,
      taskType: "interview_rehearsal",
      model: modelId,
      createdAt: now,
    });

    return { success: true, feedback: object };
  } catch {
    return { success: false, error: "AI処理に失敗しました" };
  }
}
