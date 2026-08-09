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
  interviewAnswers,
  aiExtractionLogs,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { PersonalizedAnswersSchema } from "@/types/interview-prep";

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

export async function saveCareerMemo(
  projectId: string,
  careerMemo: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const now = new Date().toISOString();
  const existing = await db.query.interviewPreparations.findFirst({
    where: and(
      eq(interviewPreparations.projectId, projectId),
      eq(interviewPreparations.userId, user.id)
    ),
  });

  if (existing) {
    await db
      .update(interviewPreparations)
      .set({ careerMemo, updatedAt: now })
      .where(eq(interviewPreparations.id, existing.id));
  } else {
    await db.insert(interviewPreparations).values({
      id: randomUUID(),
      projectId,
      userId: user.id,
      careerMemo,
      interviewType: "online",
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

export async function personalizeInterviewAnswers(
  projectId: string,
  careerMemo: string,
  questionIds: string[]
): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const trimmedMemo = careerMemo.trim();
  if (!trimmedMemo) {
    return { success: false, error: "経歴・強みメモを入力してください" };
  }

  if (questionIds.length === 0) {
    return { success: false, error: "対象の質問を選択してください" };
  }

  const prep = await db.query.interviewPreparations.findFirst({
    where: and(
      eq(interviewPreparations.projectId, projectId),
      eq(interviewPreparations.userId, user.id)
    ),
  });

  const questions = await db.query.interviewQuestions.findMany({
    where: and(
      eq(interviewQuestions.projectId, projectId),
      inArray(interviewQuestions.id, questionIds)
    ),
  });

  if (questions.length === 0) {
    return { success: false, error: "質問が見つかりません" };
  }

  const answers = await db.query.interviewAnswers.findMany({
    where: inArray(
      interviewAnswers.questionId,
      questions.map((q) => q.id)
    ),
  });
  const answerByQuestionId = new Map(
    answers.map((a) => [a.questionId, a])
  );

  const modelId = "gemini-3.1-flash-lite";
  const techStack = Array.isArray(project.techStack)
    ? project.techStack.join(", ")
    : "";

  const questionBlock = questions
    .map(
      (q, i) =>
        `[${i + 1}] questionId: ${q.id}
質問: ${q.question}
カテゴリ: ${q.category ?? "不明"}
AI回答案（参考・そのままコピーしない）: ${answerByQuestionId.get(q.id)?.aiAnswer ?? "（なし）"}`
    )
    .join("\n\n");

  const prompt = `
フリーランスエンジニアの面談回答を、経歴メモと案件情報だけに基づいてパーソナライズしてください。

## 厳守ルール
- 経歴メモと案件情報に書かれている事実のみを使うこと
- メモにない経験・実績・スキル・数値を捏造しないこと
- 不明な点は「案件の〜を活かして対応可能です」のように控えめに書くこと
- AI回答案は構成の参考にするだけで、内容はメモに根拠があるものだけ使うこと
- 各回答は面談で話す口調（です・ます調）で200〜500字程度

## 経歴・強みメモ
${trimmedMemo}

## 案件情報
タイトル: ${project.title}
技術スタック: ${techStack || "（記載なし）"}
サマリー: ${project.summary || "（なし）"}
詳細:
${project.sourceText?.slice(0, 1500) || "（なし）"}

## パーソナライズ対象の質問
${questionBlock}

各質問の questionId をそのまま返し、userAnswer にパーソナライズ済み回答を書いてください。
  `.trim();

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: PersonalizedAnswersSchema,
      prompt,
    });

    const validIds = new Set(questions.map((q) => q.id));
    const toSave = object.answers.filter((a) => validIds.has(a.questionId));

    if (toSave.length === 0) {
      return { success: false, error: "AIが有効な回答を生成できませんでした" };
    }

    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      if (prep) {
        await tx
          .update(interviewPreparations)
          .set({ careerMemo: trimmedMemo, updatedAt: now })
          .where(eq(interviewPreparations.id, prep.id));
      }

      for (const item of toSave) {
        const existing = await tx.query.interviewAnswers.findFirst({
          where: eq(interviewAnswers.questionId, item.questionId),
        });

        if (existing) {
          await tx
            .update(interviewAnswers)
            .set({ userAnswer: item.userAnswer, updatedAt: now })
            .where(eq(interviewAnswers.questionId, item.questionId));
        } else {
          await tx.insert(interviewAnswers).values({
            id: randomUUID(),
            questionId: item.questionId,
            userAnswer: item.userAnswer,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      taskType: "interview_personalize",
      model: modelId,
      createdAt: now,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, updatedCount: toSave.length };
  } catch {
    return { success: false, error: "AI処理に失敗しました" };
  }
}
