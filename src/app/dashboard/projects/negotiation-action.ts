"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import { users, projects, aiExtractionLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { NegotiationSchema, type NegotiationContent } from "@/types/negotiation";

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

export async function generateNegotiationPhrases(
  projectId: string
): Promise<{
  success: boolean;
  content?: NegotiationContent;
  error?: string;
}> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const modelId = "gemini-3.1-flash-lite";
  const techStack = Array.isArray(project.techStack)
    ? project.techStack.join(", ")
    : "（記載なし）";
  const agentLabel = [project.agentCompany, project.agentPerson]
    .filter(Boolean)
    .join(" / ");

  const prompt = `
フリーランスエンジニアがエージェント・クライアントと条件交渉する際のトーク例を作成してください。
案件情報をもとに、単価・稼働率・開始時期それぞれについて論点とそのまま使えるフレーズ例を出してください。
丁寧なビジネス調（です・ます調）で、押し付けがましくない表現にしてください。
案件に記載のない条件は「要確認」として交渉の余地がある書き方にしてください。

案件タイトル: ${project.title}
エージェント: ${agentLabel || "（不明）"}
単価: ${project.price || "（未記載）"}
稼働率: ${project.workRate || "（未記載）"}
開始時期: ${project.startDateText || "（未記載）"}
契約期間: ${project.contractPeriod || "（未記載）"}
勤務地: ${project.location || "（未記載）"}
リモート区分: ${project.remoteType || "（未記載）"}
技術スタック: ${techStack}
案件サマリー: ${project.summary || "（なし）"}

各カテゴリ（rate / workload / startDate）について:
- talkingPoints: 交渉時に押さえる論点（2〜4件）
- samplePhrases: そのまま使えるフレーズ例（2〜4件）
  `.trim();

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: NegotiationSchema,
      prompt,
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      taskType: "negotiation_phrases",
      model: modelId,
      createdAt: new Date().toISOString(),
    });

    return { success: true, content: object };
  } catch {
    return { success: false, error: "AI処理に失敗しました" };
  }
}
