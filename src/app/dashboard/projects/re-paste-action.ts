"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import { users, projects, aiExtractionLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { ProjectExtractionSchema, type ProjectExtraction } from "@/types/ai";
import {
  updateProjectBasicInfo,
  type UpdateProjectBasicInfoInput,
} from "./actions";
import type { ProjectStatus } from "@/types/project";

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

export async function extractProjectUpdateFromText(
  projectId: string,
  sourceText: string
): Promise<{ success: boolean; data?: ProjectExtraction; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  if (!sourceText.trim()) {
    return { success: false, error: "テキストを入力してください" };
  }

  const modelId = "gemini-3.1-flash-lite";
  const techStack = Array.isArray(project.techStack)
    ? project.techStack.join(", ")
    : "";

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: ProjectExtractionSchema,
      prompt: `
フリーランスエージェントからの新しいメール本文を読み、案件情報を構造化して抽出してください。
既存の案件情報も参考にし、新しいメールの内容を優先してください。

既存の案件情報:
- タイトル: ${project.title}
- エージェント会社: ${project.agentCompany || "（なし）"}
- 担当者: ${project.agentPerson || "（なし）"}
- サマリー: ${project.summary || "（なし）"}
- 単価: ${project.price || "（なし）"}
- 稼働率: ${project.workRate || "（なし）"}
- 勤務地: ${project.location || "（なし）"}
- リモート区分: ${project.remoteType || "（なし）"}
- 技術スタック: ${techStack || "（なし）"}
- 開始時期: ${project.startDateText || "（なし）"}
- 契約期間: ${project.contractPeriod || "（なし）"}
- 次のアクション: ${project.nextAction || "（なし）"}
- ステータス: ${project.status}

新しいメール本文:
${sourceText}

抽出ガイドライン:
- title: 案件タイトルを簡潔に。不明な場合は既存タイトルを維持
- remoteType: full_remote（フルリモート）/ partial_remote（一部リモート）/ on_site（常駐）
- suggestedStatus: 返信が必要なら reply_required、面談調整中なら interview_scheduling など
- suggestedNextAction: ユーザーが次に取るべきアクション
- concerns: 条件が不明な点や確認が必要な事項をリストアップ
      `.trim(),
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      inputText: sourceText,
      outputJson: object,
      taskType: "project_re_paste",
      model: modelId,
      createdAt: new Date().toISOString(),
    });

    return { success: true, data: object };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI処理に失敗しました";
    return { success: false, error: message };
  }
}

export type AcceptedProjectUpdateFields = {
  title?: boolean;
  agentCompany?: boolean;
  agentPerson?: boolean;
  summary?: boolean;
  price?: boolean;
  workRate?: boolean;
  location?: boolean;
  remoteType?: boolean;
  techStack?: boolean;
  startDateText?: boolean;
  contractPeriod?: boolean;
  nextAction?: boolean;
  status?: boolean;
  sourceText?: boolean;
};

export async function applyAcceptedProjectUpdates(
  projectId: string,
  newSourceText: string,
  extraction: ProjectExtraction,
  accepted: AcceptedProjectUpdateFields
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const hasAccepted = Object.values(accepted).some(Boolean);
  if (!hasAccepted) {
    return { success: false, error: "更新する項目を選択してください" };
  }

  const input: UpdateProjectBasicInfoInput = {};

  if (accepted.title && extraction.title) {
    input.title = extraction.title;
  }
  if (accepted.agentCompany && extraction.agentCompany !== undefined) {
    input.agentCompany = extraction.agentCompany;
  }
  if (accepted.agentPerson && extraction.agentPerson !== undefined) {
    input.agentPerson = extraction.agentPerson;
  }
  if (accepted.summary && extraction.summary !== undefined) {
    input.summary = extraction.summary;
  }
  if (accepted.price && extraction.price !== undefined) {
    input.price = extraction.price;
  }
  if (accepted.workRate && extraction.workRate !== undefined) {
    input.workRate = extraction.workRate;
  }
  if (accepted.location && extraction.location !== undefined) {
    input.location = extraction.location;
  }
  if (accepted.remoteType && extraction.remoteType !== undefined) {
    input.remoteType = extraction.remoteType;
  }
  if (
    accepted.techStack &&
    extraction.techStack &&
    extraction.techStack.length > 0
  ) {
    input.techStack = extraction.techStack;
  }
  if (accepted.startDateText && extraction.startDateText !== undefined) {
    input.startDateText = extraction.startDateText;
  }
  if (accepted.contractPeriod && extraction.contractPeriod !== undefined) {
    input.contractPeriod = extraction.contractPeriod;
  }
  if (accepted.nextAction && extraction.suggestedNextAction !== undefined) {
    input.nextAction = extraction.suggestedNextAction;
  }
  if (accepted.status && extraction.suggestedStatus !== undefined) {
    input.status = extraction.suggestedStatus as ProjectStatus;
  }
  if (accepted.sourceText && newSourceText.trim()) {
    input.sourceText = newSourceText.trim();
  }

  const result = await updateProjectBasicInfo(projectId, input);
  if (result.success) {
    revalidatePath(`/dashboard/projects/${projectId}`);
  }
  return result;
}
