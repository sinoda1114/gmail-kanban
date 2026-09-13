"use server";

import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/db/client";
import {
  users,
  projects,
  interviewResearchPacks,
  aiExtractionLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
  GEMINI_RESEARCH_MODEL_ID,
  GEMINI_JSON_PROVIDER_OPTIONS,
} from "@/lib/ai-model";
import { InterviewResearchPackSchema } from "@/types/interview-research";
import type { InterviewResearchPack } from "@/types/interview-research";
import {
  buildInterviewResearchPrompt,
  collectSourceUrls,
} from "@/lib/interview-research";
import { parseJsonWithSchema } from "@/lib/ai-json";

function logAiFailure(taskType: string, error: unknown) {
  console.error(`${taskType} failed`, {
    taskType,
    message: error instanceof Error ? error.message : "unknown error",
  });
}

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

async function generateResearchPack(
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
  }
): Promise<{ pack: InterviewResearchPack; sources: string[] }> {
  const modelId = GEMINI_RESEARCH_MODEL_ID;
  const prompt = buildInterviewResearchPrompt(project);
  const tools = {
    google_search: google.tools.googleSearch({}),
  };

  try {
    const result = await generateText({
      model: google(modelId),
      tools,
      output: Output.object({ schema: InterviewResearchPackSchema }),
      providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
      prompt,
    });
    if (!result.output) {
      throw new Error("empty structured output");
    }
    return {
      pack: result.output,
      sources: collectSourceUrls(result.sources),
    };
  } catch (error) {
    logAiFailure("interview_research_structured_output", error);
    const result = await generateText({
      model: google(modelId),
      tools,
      providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
      prompt: `${prompt}\n\n必ず JSON オブジェクトだけを返してください。`,
    });
    return {
      pack: parseJsonWithSchema(result.text, InterviewResearchPackSchema),
      sources: collectSourceUrls(result.sources),
    };
  }
}

export async function generateInterviewResearch(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const now = new Date().toISOString();

  try {
    const { pack, sources } = await generateResearchPack(project);

    await db
      .insert(interviewResearchPacks)
      .values({
        id: randomUUID(),
        projectId,
        userId: user.id,
        pack,
        sources,
        model: GEMINI_RESEARCH_MODEL_ID,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          interviewResearchPacks.projectId,
          interviewResearchPacks.userId,
        ],
        set: {
          pack,
          sources,
          model: GEMINI_RESEARCH_MODEL_ID,
          updatedAt: now,
        },
      });

    await db.insert(aiExtractionLogs).values({
      id: randomUUID(),
      userId: user.id,
      projectId,
      taskType: "interview_research",
      model: GEMINI_RESEARCH_MODEL_ID,
      createdAt: now,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    logAiFailure("interview_research", error);
    return { success: false, error: "AI処理に失敗しました" };
  }
}
