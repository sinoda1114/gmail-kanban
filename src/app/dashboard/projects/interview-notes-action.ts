"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, projects, interviewNotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { PROJECT_STATUSES } from "@/types/project";

const VALID_TEMPERATURES = ["very_positive", "positive", "neutral", "negative"] as const;

export type SaveInterviewNoteInput = {
  duringNote?: string;
  afterNote?: string;
  impression?: string;
  ownTemperature?: string;
  concern?: string;
  nextAction?: string;
  resultStatus?: string;
};

async function getAuthedUser() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, clerkUserId) });
  return user ?? null;
}

export async function saveInterviewNote(
  projectId: string,
  input: SaveInterviewNoteInput
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (input.resultStatus !== undefined && input.resultStatus !== "" &&
      !(PROJECT_STATUSES as readonly string[]).includes(input.resultStatus)) {
    return { success: false, error: "Invalid resultStatus" };
  }
  if (input.ownTemperature !== undefined && input.ownTemperature !== "" &&
      !(VALID_TEMPERATURES as readonly string[]).includes(input.ownTemperature)) {
    return { success: false, error: "Invalid ownTemperature" };
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
  });
  if (!project) return { success: false, error: "Project not found" };

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
      .set({
        duringNote: input.duringNote ?? existing.duringNote,
        afterNote: input.afterNote ?? existing.afterNote,
        impression: input.impression ?? existing.impression,
        ownTemperature: input.ownTemperature ?? existing.ownTemperature,
        concern: input.concern ?? existing.concern,
        nextAction: input.nextAction ?? existing.nextAction,
        resultStatus: input.resultStatus ?? existing.resultStatus,
        updatedAt: now,
      })
      .where(eq(interviewNotes.id, existing.id));
  } else {
    await db.insert(interviewNotes).values({
      id: randomUUID(),
      projectId,
      userId: user.id,
      duringNote: input.duringNote,
      afterNote: input.afterNote,
      impression: input.impression,
      ownTemperature: input.ownTemperature,
      concern: input.concern,
      nextAction: input.nextAction,
      resultStatus: input.resultStatus,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}
