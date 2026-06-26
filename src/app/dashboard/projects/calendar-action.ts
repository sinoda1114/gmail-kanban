"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import {
  users,
  projects,
  interviewPreparations,
  calendarEvents,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

type CalendarResult =
  | { success: true; calendarUrl: string }
  | { success: false; error: string };

type GoogleCalendarEventResponse = {
  id: string;
  htmlLink: string;
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

async function callGoogleCalendarApi(
  accessToken: string,
  method: "POST" | "PATCH",
  eventId: string | undefined,
  body: object
): Promise<GoogleCalendarEventResponse | null> {
  const baseUrl =
    "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  const url = method === "PATCH" && eventId ? `${baseUrl}/${eventId}` : baseUrl;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  return (await res.json()) as GoogleCalendarEventResponse;
}

export async function createCalendarEvent(
  projectId: string
): Promise<CalendarResult> {
  const user = await getAuthedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const project = await getOwnedProject(projectId, user.id);
  if (!project) return { success: false, error: "Project not found" };

  const prep = await db.query.interviewPreparations.findFirst({
    where: and(
      eq(interviewPreparations.projectId, projectId),
      eq(interviewPreparations.userId, user.id)
    ),
  });

  if (!prep?.interviewAt) {
    return { success: false, error: "面談日時が設定されていません" };
  }

  let accessToken: string | undefined;
  try {
    const client = await clerkClient();
    const tokenResponse = await client.users.getUserOauthAccessToken(
      user.clerkUserId,
      "oauth_google"
    );
    accessToken = tokenResponse.data[0]?.token;
  } catch {
    return {
      success: false,
      error: "Google アカウント連携の確認中にエラーが発生しました",
    };
  }

  if (!accessToken) {
    return { success: false, error: "Google アカウントが連携されていません" };
  }

  // Z サフィックスを付けず timeZone フィールドで Asia/Tokyo を適用する形式に統一
  const startAt = dayjs(prep.interviewAt).format("YYYY-MM-DDTHH:mm:ss");
  const endAt = dayjs(prep.interviewAt).add(1, "hour").format("YYYY-MM-DDTHH:mm:ss");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const eventTitle = `面談: ${project.title}`;
  const eventBody = {
    summary: eventTitle,
    description: `${siteUrl}/dashboard/projects/${projectId}`,
    start: { dateTime: startAt, timeZone: "Asia/Tokyo" },
    end: { dateTime: endAt, timeZone: "Asia/Tokyo" },
    reminders: { useDefault: true },
  };

  const existing = await db.query.calendarEvents.findFirst({
    where: and(
      eq(calendarEvents.projectId, projectId),
      eq(calendarEvents.userId, user.id)
    ),
  });

  let event: GoogleCalendarEventResponse | null = null;
  try {
    if (existing?.googleEventId) {
      // 既存イベントは PATCH で更新（GCal 上に重複イベントを作らない）
      event = await callGoogleCalendarApi(
        accessToken,
        "PATCH",
        existing.googleEventId,
        eventBody
      );
    }
    // PATCH 失敗（イベント削除済み等）または新規の場合は POST
    if (!event) {
      event = await callGoogleCalendarApi(
        accessToken,
        "POST",
        undefined,
        eventBody
      );
    }
  } catch {
    return { success: false, error: "カレンダー登録中にエラーが発生しました" };
  }

  if (!event?.htmlLink) {
    return { success: false, error: "Google カレンダーへの登録に失敗しました" };
  }

  try {
    if (existing) {
      await db
        .update(calendarEvents)
        .set({
          googleEventId: event.id,
          calendarUrl: event.htmlLink,
          title: eventTitle,
          startAt,
          endAt,
        })
        .where(eq(calendarEvents.id, existing.id));
    } else {
      await db.insert(calendarEvents).values({
        id: randomUUID(),
        projectId,
        userId: user.id,
        googleEventId: event.id,
        calendarUrl: event.htmlLink,
        title: eventTitle,
        startAt,
        endAt,
        createdAt: new Date().toISOString(),
      });
    }
  } catch {
    return { success: false, error: "カレンダー情報の保存中にエラーが発生しました" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, calendarUrl: event.htmlLink };
}
