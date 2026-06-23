"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "@/db/client";
import { users, aiExtractionLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ProjectExtractionSchema, type ProjectExtraction } from "@/types/ai";

export async function extractProjectFromText(
  sourceText: string
): Promise<{ success: boolean; data?: ProjectExtraction; error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, error: "Unauthorized" };

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (!user) return { success: false, error: "User not found" };

  if (!sourceText.trim()) {
    return { success: false, error: "テキストを入力してください" };
  }

  const modelId = "gpt-4o-mini";

  try {
    const { object } = await generateObject({
      model: openai(modelId),
      schema: ProjectExtractionSchema,
      prompt: `
フリーランスエージェントからのメール本文を読み、案件情報を構造化して抽出してください。

メール本文:
${sourceText}

抽出ガイドライン:
- title: 案件タイトルを簡潔に。不明な場合は「エージェントからの案件」形式で
- remoteType: full_remote（フルリモート）/ partial_remote（一部リモート）/ on_site（常駐）
- suggestedStatus: 返信が必要なら reply_required、面談調整中なら interview_scheduling
- concerns: 条件が不明な点や確認が必要な事項をリストアップ
      `.trim(),
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      inputText: sourceText,
      outputJson: object,
      taskType: "project_extraction",
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
