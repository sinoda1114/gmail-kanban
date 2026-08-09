"use client";

import { Tabs, Stack, Group, Badge, Text } from "@mantine/core";
import type {
  Project,
  ProjectStatusHistory,
  InterviewPreparation,
  InterviewQuestion,
  InterviewAnswer,
  InterviewReverseQuestion,
  InterviewNote,
  CalendarEvent,
} from "@/db/schema";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  type ProjectStatus,
} from "@/types/project";
import { BasicInfoTab } from "./BasicInfoTab";
import { InterviewPrepTab } from "./InterviewPrepTab";
import { InterviewNoteTab } from "./InterviewNoteTab";
import { resolveProjectDetailTab } from "@/lib/project-detail";

type QuestionWithAnswer = InterviewQuestion & {
  answer: InterviewAnswer | null;
};

interface ProjectDetailViewProps {
  project: Project;
  statusHistory: ProjectStatusHistory[];
  interviewPrep: InterviewPreparation | null;
  interviewQuestions: QuestionWithAnswer[];
  reverseQuestions: InterviewReverseQuestion[];
  interviewNote: InterviewNote | null;
  calendarEvent: CalendarEvent | null;
  initialTab?: string;
}

export function ProjectDetailView({
  project,
  statusHistory,
  interviewPrep,
  interviewQuestions,
  reverseQuestions,
  interviewNote,
  calendarEvent,
  initialTab,
}: ProjectDetailViewProps) {
  const tab = resolveProjectDetailTab(initialTab);

  return (
    <Tabs defaultValue={tab} key={tab}>
      <Tabs.List>
        <Tabs.Tab value="basic">基本情報</Tabs.Tab>
        <Tabs.Tab value="interview_prep">面談準備</Tabs.Tab>
        <Tabs.Tab value="interview_note">面談メモ</Tabs.Tab>
        <Tabs.Tab value="history">履歴</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="basic">
        <BasicInfoTab project={project} />
      </Tabs.Panel>

      <Tabs.Panel value="interview_prep">
        <InterviewPrepTab
          project={project}
          prep={interviewPrep}
          questions={interviewQuestions}
          reverseQuestions={reverseQuestions}
          calendarUrl={calendarEvent?.calendarUrl ?? null}
        />
      </Tabs.Panel>

      <Tabs.Panel value="interview_note">
        <InterviewNoteTab project={project} note={interviewNote} />
      </Tabs.Panel>

      <Tabs.Panel value="history">
        <Stack gap="xs" p="md">
          {statusHistory.map((h) => (
            <Group key={h.id} gap="xs">
              <Text size="sm" c="dimmed">
                {new Date(h.changedAt).toLocaleString("ja-JP")}
              </Text>
              <Badge variant="light" size="sm">
                {STATUS_LABELS[h.fromStatus as ProjectStatus] ??
                  h.fromStatus ??
                  "開始"}
              </Badge>
              <Text size="xs">→</Text>
              <Badge
                variant="filled"
                size="sm"
                color={STATUS_COLORS[h.toStatus as ProjectStatus]}
              >
                {STATUS_LABELS[h.toStatus as ProjectStatus] ?? h.toStatus}
              </Badge>
              {h.reason && (
                <Text size="xs" c="dimmed">
                  ({h.reason})
                </Text>
              )}
            </Group>
          ))}
          {statusHistory.length === 0 && (
            <Text size="sm" c="dimmed">
              履歴がありません。
            </Text>
          )}
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
}
