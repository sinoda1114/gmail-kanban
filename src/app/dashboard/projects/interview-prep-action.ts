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
  interviewReverseQuestions,
  aiExtractionLogs,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { InterviewPrepAISchema } from "@/types/interview-prep";
import { buildPartnerPromptGuidance } from "@/lib/interview-prep-prompt";

export type SaveInterviewInfoInput = {
  interviewAt?: string;
  interviewUrl?: string;
  interviewType?: string;
  interviewPartner?: string;
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

function buildInterviewPrepPrompt(
  project: {
    title: string;
    techStack: string[] | null;
    agentCompany: string | null;
    summary: string | null;
    sourceText: string | null;
    price: string | null;
    workRate: string | null;
    location: string | null;
    remoteType: string | null;
    contractPeriod: string | null;
    startDateText: string | null;
  },
  interviewType: string | null | undefined,
  interviewPartner: string | null | undefined
): string {
  const techStack = Array.isArray(project.techStack)
    ? project.techStack.join(", ")
    : "";
  const partnerGuidance = buildPartnerPromptGuidance(interviewPartner);

  return `
フリーランスの面談準備をしてください。以下の案件情報を参考にしてください。

案件タイトル: ${project.title}
技術スタック: ${techStack || "（記載なし）"}
エージェント会社: ${project.agentCompany || "（不明）"}
案件サマリー: ${project.summary || "（なし）"}
単価・報酬: ${project.price || "（記載なし）"}
稼働率: ${project.workRate || "（記載なし）"}
勤務地: ${project.location || "（記載なし）"}
リモート: ${project.remoteType || "（記載なし）"}
契約期間: ${project.contractPeriod || "（記載なし）"}
開始時期: ${project.startDateText || "（記載なし）"}
面談形式: ${interviewType === "onsite" ? "対面" : "オンライン"}
案件詳細:
${project.sourceText || "（なし）"}

${partnerGuidance}

以下を生成してください:
1. questions: 面接でよく聞かれる想定質問（最大15件）とAI回答案。カテゴリはtechnical/pm/condition/experienceのいずれか。priorityはhigh/medium/lowで。面談相手の種別に合わせて質問の比重を調整。
2. reverseQuestions: 自分から聞く逆質問（各カテゴリ2〜3件）。面談相手に応じた確認事項を含める。
3. strategy: 面談で強調すべき経験・注意すべき点・アピール方針を具体的に。
4. concerns: 事前に確認すべき懸念点・不明点（最大6件）。一般的な確認事項。
5. checklist: 面談前日〜当日にチェックすべき項目（最大8件）。
6. companyBrief: 企業・クライアント向けブリーフ。domain（事業ドメイン）、hypotheses（仮説。basisはevidence=案件記載根拠/speculation=推測。sourceHintに根拠の出典）、talkingPoints（話すべきトピック）、topicsToAvoid（避ける話題）。
7. techDeepDive: 技術スタックの各項目について深掘り準備。技術スタックが空なら空配列[]を返す。各項目にtech/deepDiveTopics/experienceConnection/phrasesToAvoid。
8. redFlags: 判断・契約前確認に焦点を当てたレッドフラグ（concernsとは別。severity付き・confirmationQuestion必須）。単価・働き方・出社・期間・要件曖昧さなどをカバー（最大8件）。
9. cheatSheet: 面談当日用ワンページ要約。keyExperiences/numbers(任意)/topReverseQuestions/dontTouchPoints/summary。既存の想定質問・戦略・レッドフラグを統合して簡潔に。
  `.trim();
}

export async function saveInterviewInfo(
  projectId: string,
  input: SaveInterviewInfoInput
): Promise<{ success: boolean; error?: string; prepId?: string }> {
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
      .set({
        interviewAt: input.interviewAt ?? existing.interviewAt,
        interviewUrl: input.interviewUrl ?? existing.interviewUrl,
        interviewType: input.interviewType ?? existing.interviewType,
        interviewPartner: input.interviewPartner ?? existing.interviewPartner,
        updatedAt: now,
      })
      .where(eq(interviewPreparations.id, existing.id));
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, prepId: existing.id };
  }

  const prepId = randomUUID();
  await db.insert(interviewPreparations).values({
    id: prepId,
    projectId,
    userId: user.id,
    interviewAt: input.interviewAt,
    interviewUrl: input.interviewUrl,
    interviewType: input.interviewType ?? "online",
    interviewPartner: input.interviewPartner ?? "general",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, prepId };
}

export async function generateInterviewPrep(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const existing = await db.query.interviewPreparations.findFirst({
    where: and(
      eq(interviewPreparations.projectId, projectId),
      eq(interviewPreparations.userId, user.id)
    ),
  });

  const now = new Date().toISOString();
  let prepId: string;

  if (existing) {
    prepId = existing.id;
  } else {
    prepId = randomUUID();
    await db.insert(interviewPreparations).values({
      id: prepId,
      projectId,
      userId: user.id,
      interviewType: "online",
      interviewPartner: "general",
      createdAt: now,
      updatedAt: now,
    });
  }

  const modelId = "gemini-3.1-flash-lite";
  const prep = await db.query.interviewPreparations.findFirst({
    where: eq(interviewPreparations.id, prepId),
  });

  const prompt = buildInterviewPrepPrompt(
    project,
    prep?.interviewType,
    prep?.interviewPartner ?? "general"
  );

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: InterviewPrepAISchema,
      prompt,
    });

    await db.transaction(async (tx) => {
      const existingQuestions = await tx
        .select({ id: interviewQuestions.id })
        .from(interviewQuestions)
        .where(eq(interviewQuestions.preparationId, prepId));

      if (existingQuestions.length > 0) {
        const qIds = existingQuestions.map((q) => q.id);
        await tx
          .delete(interviewAnswers)
          .where(inArray(interviewAnswers.questionId, qIds));
        await tx
          .delete(interviewQuestions)
          .where(eq(interviewQuestions.preparationId, prepId));
      }

      await tx
        .delete(interviewReverseQuestions)
        .where(eq(interviewReverseQuestions.preparationId, prepId));

      for (let i = 0; i < object.questions.length; i++) {
        const q = object.questions[i];
        const qId = randomUUID();
        await tx.insert(interviewQuestions).values({
          id: qId,
          preparationId: prepId,
          projectId,
          question: q.question,
          category: q.category,
          priority: q.priority,
          sortOrder: i,
          createdAt: now,
        });
        await tx.insert(interviewAnswers).values({
          id: randomUUID(),
          questionId: qId,
          aiAnswer: q.aiAnswer,
          createdAt: now,
          updatedAt: now,
        });
      }

      for (let i = 0; i < object.reverseQuestions.length; i++) {
        const rq = object.reverseQuestions[i];
        await tx.insert(interviewReverseQuestions).values({
          id: randomUUID(),
          preparationId: prepId,
          projectId,
          question: rq.question,
          category: rq.category,
          checked: false,
          sortOrder: i,
          createdAt: now,
        });
      }

      await tx
        .update(interviewPreparations)
        .set({
          strategy: object.strategy,
          concerns: object.concerns,
          checklist: object.checklist,
          companyBrief: object.companyBrief,
          techDeepDive: object.techDeepDive,
          redFlags: object.redFlags,
          cheatSheet: object.cheatSheet,
          updatedAt: now,
        })
        .where(eq(interviewPreparations.id, prepId));
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      taskType: "interview_prep",
      model: modelId,
      createdAt: now,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "AI処理に失敗しました",
    };
  }
}

export async function updateInterviewAnswer(
  questionId: string,
  userAnswer: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const question = await db.query.interviewQuestions.findFirst({
    where: eq(interviewQuestions.id, questionId),
  });
  if (!question) return { success: false, error: "Question not found" };

  const project = await getOwnedProject(question.projectId, user.id);
  if (!project) return { success: false, error: "Unauthorized" };

  const now = new Date().toISOString();
  const existing = await db.query.interviewAnswers.findFirst({
    where: eq(interviewAnswers.questionId, questionId),
  });

  if (existing) {
    await db
      .update(interviewAnswers)
      .set({ userAnswer, updatedAt: now })
      .where(eq(interviewAnswers.questionId, questionId));
  } else {
    await db.insert(interviewAnswers).values({
      id: randomUUID(),
      questionId,
      userAnswer,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath(`/dashboard/projects/${question.projectId}`);
  return { success: true };
}

export async function toggleReverseQuestionChecked(
  reverseQuestionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const rq = await db.query.interviewReverseQuestions.findFirst({
    where: eq(interviewReverseQuestions.id, reverseQuestionId),
  });
  if (!rq) return { success: false, error: "Not found" };

  const project = await getOwnedProject(rq.projectId, user.id);
  if (!project) return { success: false, error: "Unauthorized" };

  await db
    .update(interviewReverseQuestions)
    .set({ checked: !rq.checked })
    .where(eq(interviewReverseQuestions.id, reverseQuestionId));

  revalidatePath(`/dashboard/projects/${rq.projectId}`);
  return { success: true };
}
