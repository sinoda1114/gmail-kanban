"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projects, reminders, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { ReminderType } from "@/types/project";

export async function markReminderDone(input: {
  projectId: string;
  reminderType: ReminderType;
  fingerprint: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, error: "Unauthorized" };

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (!user) return { success: false, error: "User not found" };

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, input.projectId), eq(projects.userId, user.id)),
  });
  if (!project) return { success: false, error: "Project not found" };

  const now = new Date().toISOString();

  const existing = await db.query.reminders.findFirst({
    where: and(
      eq(reminders.userId, user.id),
      eq(reminders.projectId, input.projectId),
      eq(reminders.reminderType, input.reminderType)
    ),
  });

  if (existing) {
    await db
      .update(reminders)
      .set({
        done: true,
        message: input.fingerprint,
        remindAt: now,
      })
      .where(eq(reminders.id, existing.id));
  } else {
    await db.insert(reminders).values({
      id: randomUUID(),
      projectId: input.projectId,
      userId: user.id,
      reminderType: input.reminderType,
      remindAt: now,
      message: input.fingerprint,
      done: true,
    });
  }

  revalidatePath("/dashboard/alerts");
  return { success: true };
}
