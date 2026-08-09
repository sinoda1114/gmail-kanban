"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import { users, projects, aiExtractionLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ReplyDraftSchema } from "@/types/reply-draft";

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

function truncateText(text: string | null | undefined, maxLength: number) {
  if (!text) return "（なし）";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export async function generateReplyDraft(
  projectId: string
): Promise<{ success: boolean; draft?: string; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  // Project-standard model id (see AGENTS.md); keep in sync with other AI actions.
  const modelId = "gemini-3.1-flash-lite";
  const agentLabel = [project.agentCompany, project.agentPerson]
    .filter(Boolean)
    .join(" / ");

  const prompt = `
フリーランスエンジニアがエージェント宛に送る返信メールのドラフトを作成してください。
丁寧なビジネスメール調（です・ます調）で、簡潔かつ具体的に書いてください。
件名は不要です。本文のみ生成してください。

案件タイトル: ${project.title}
エージェント: ${agentLabel || "（不明）"}
案件サマリー: ${project.summary || "（なし）"}
次のアクション: ${project.nextAction || "（なし）"}
メール本文（抜粋）:
${truncateText(project.sourceText, 2000)}

ガイドライン:
- 冒頭は適切な挨拶から始める
- 案件への関心・返信の意図を明確にする
- 次のアクションが設定されている場合はそれに沿った内容にする
- 不明点があれば確認事項を含めてもよい
- 署名（名前）は「[お名前]」のプレースホルダーで終える
  `.trim();

  try {
    const { object } = await generateObject({
      model: google(modelId),
      schema: ReplyDraftSchema,
      prompt,
    });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      inputText: prompt,
      outputJson: object,
      taskType: "reply_draft",
      model: modelId,
      createdAt: new Date().toISOString(),
    });

    const draft = object.body.trim();
    if (!draft) {
      return {
        success: false,
        error: "返信ドラフトが生成されませんでした。もう一度お試しください。",
      };
    }

    return { success: true, draft };
  } catch (error) {
    console.error("reply_draft generation failed", {
      projectId,
      taskType: "reply_draft",
      message: error instanceof Error ? error.message : "unknown error",
    });
    return { success: false, error: "AI処理に失敗しました" };
  }
}
