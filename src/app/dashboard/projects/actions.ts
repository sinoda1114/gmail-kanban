"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projects, projectStatusHistory, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { ProjectStatus } from "@/types/project";

export type CreateProjectInput = {
  title: string;
  gmailUrl?: string;
  sourceText?: string;
  agentCompany?: string;
  agentPerson?: string;
  nextAction?: string;
};

export type UpdateProjectBasicInfoInput = {
  title?: string;
  agentCompany?: string;
  agentPerson?: string;
  status?: ProjectStatus;
  closeReason?: string;
  gmailUrl?: string;
  price?: string;
  workRate?: string;
  location?: string;
  remoteType?: string;
  techStack?: string[];
  startDateText?: string;
  contractPeriod?: string;
  nextAction?: string;
  reminderDate?: string;
  lastContactAt?: string;
  summary?: string;
  sourceText?: string;
};

export async function createProject(
  input: CreateProjectInput
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, error: "Unauthorized" };

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (!user) return { success: false, error: "User not found" };

  if (!input.title.trim()) {
    return { success: false, error: "タイトルは必須です" };
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(projects).values({
    id,
    userId: user.id,
    title: input.title,
    status: "reply_required",
    gmailUrl: input.gmailUrl,
    sourceText: input.sourceText,
    agentCompany: input.agentCompany,
    agentPerson: input.agentPerson,
    nextAction: input.nextAction,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard");
  return { success: true, projectId: id };
}

export async function updateProjectBasicInfo(
  projectId: string,
  input: UpdateProjectBasicInfoInput
): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, error: "Unauthorized" };

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (!user) return { success: false, error: "User not found" };

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
  });
  if (!project) return { success: false, error: "Project not found" };

  const now = new Date().toISOString();
  const statusChanged =
    input.status !== undefined && input.status !== project.status;

  await db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.agentCompany !== undefined && {
          agentCompany: input.agentCompany,
        }),
        ...(input.agentPerson !== undefined && {
          agentPerson: input.agentPerson,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.closeReason !== undefined && {
          closeReason: input.closeReason,
        }),
        ...(input.gmailUrl !== undefined && { gmailUrl: input.gmailUrl }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.workRate !== undefined && { workRate: input.workRate }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.remoteType !== undefined && {
          remoteType: input.remoteType,
        }),
        ...(input.techStack !== undefined && { techStack: input.techStack }),
        ...(input.startDateText !== undefined && {
          startDateText: input.startDateText,
        }),
        ...(input.contractPeriod !== undefined && {
          contractPeriod: input.contractPeriod,
        }),
        ...(input.nextAction !== undefined && {
          nextAction: input.nextAction,
        }),
        ...(input.reminderDate !== undefined && {
          reminderDate: input.reminderDate,
        }),
        ...(input.lastContactAt !== undefined && {
          lastContactAt: input.lastContactAt,
        }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.sourceText !== undefined && {
          sourceText: input.sourceText,
        }),
        updatedAt: now,
      })
      .where(eq(projects.id, projectId));

    if (statusChanged) {
      await tx.insert(projectStatusHistory).values({
        id: randomUUID(),
        projectId,
        userId: user.id,
        fromStatus: project.status,
        toStatus: input.status!,
        changedAt: now,
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, error: "Unauthorized" };

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (!user) return { success: false, error: "User not found" };

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
  });
  if (!project) return { success: false, error: "Project not found" };

  await db.delete(projects).where(eq(projects.id, projectId));

  revalidatePath("/dashboard");
  return { success: true };
}
