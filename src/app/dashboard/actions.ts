"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projects, projectStatusHistory, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { ProjectStatus } from "@/types/project";

export async function updateProjectStatus(
  projectId: string,
  newStatus: ProjectStatus
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

  await db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({ status: newStatus, updatedAt: now })
      .where(eq(projects.id, projectId));

    await tx.insert(projectStatusHistory).values({
      id: randomUUID(),
      projectId,
      userId: user.id,
      fromStatus: project.status,
      toStatus: newStatus,
      changedAt: now,
    });
  });

  revalidatePath("/dashboard");
  return { success: true };
}
