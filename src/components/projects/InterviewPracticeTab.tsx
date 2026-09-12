"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  Button,
  Textarea,
  Paper,
  Title,
  Badge,
  List,
  Divider,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlayerPlay, IconSend } from "@tabler/icons-react";
import type {
  InterviewQuestion,
  InterviewAnswer,
  InterviewPracticeSession,
} from "@/db/schema";
import type { RehearsalFeedback } from "@/types/interview-prep";
import {
  startInterviewPractice,
  submitPracticeReply,
} from "@/app/dashboard/projects/interview-practice-action";
import { InterviewRehearsalSection } from "./InterviewRehearsalSection";

interface QuestionWithAnswer extends InterviewQuestion {
  answer: InterviewAnswer | null;
}

interface InterviewPracticeTabProps {
  projectId: string;
  questions: QuestionWithAnswer[];
  session: InterviewPracticeSession | null;
}

export function InterviewPracticeTab({
  projectId,
  questions,
  session,
}: InterviewPracticeTabProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const active = session?.status === "active";
  const completed = session?.status === "completed";
  const feedback = session?.feedback as RehearsalFeedback | null;

  async function handleStart() {
    setStarting(true);
    setError(null);
    const result = await startInterviewPractice(projectId);
    setStarting(false);
    if (result.success) {
      setDraft("");
      router.refresh();
      notifications.show({
        color: "teal",
        message: "通し練習を開始しました。相手役の質問に答えてください。",
      });
    } else {
      setError(result.error ?? "開始に失敗しました");
    }
  }

  async function handleReply() {
    if (!session) return;
    if (!draft.trim()) {
      notifications.show({ color: "yellow", message: "回答を入力してください" });
      return;
    }
    setSending(true);
    setError(null);
    const result = await submitPracticeReply(session.id, draft);
    setSending(false);
    if (result.success) {
      setDraft("");
      router.refresh();
    } else {
      setError(result.error ?? "送信に失敗しました");
    }
  }

  return (
    <Stack gap="md" p="md">
      {error && (
        <Alert color="red" title="エラー">
          {error}
        </Alert>
      )}

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="sm">
          <Title order={5}>通し練習</Title>
          {session && (
            <Badge
              variant="light"
              color={completed ? "gray" : "teal"}
            >
              {completed ? "終了" : "進行中"}
            </Badge>
          )}
        </Group>
        <Text size="sm" c="dimmed" mb="sm">
          相手役が連続で質問し、回答を深掘りします。最後に短いフィードバックが出ます（テキストのみ）。
        </Text>
        <Button
          variant="light"
          color="violet"
          leftSection={<IconPlayerPlay size={16} />}
          loading={starting}
          onClick={handleStart}
        >
          {session ? "通し練習をやり直す" : "通し練習を開始"}
        </Button>
      </Paper>

      {session && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            {session.messages.map((m, i) => (
              <Paper
                key={`${m.role}-${i}`}
                withBorder
                p="sm"
                radius="sm"
                bg={m.role === "interviewer" ? "gray.0" : undefined}
                style={
                  m.role === "candidate"
                    ? { borderColor: "var(--mantine-color-teal-3)" }
                    : undefined
                }
              >
                <Text size="xs" fw={600} c="dimmed" mb={4}>
                  {m.role === "interviewer" ? "相手役" : "あなた"}
                </Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {m.content}
                </Text>
              </Paper>
            ))}

            {active && (
              <>
                <Textarea
                  label="あなたの回答"
                  placeholder="面談で話すつもりで書いてください..."
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Group justify="flex-end">
                  <Button
                    leftSection={<IconSend size={16} />}
                    loading={sending}
                    onClick={handleReply}
                  >
                    回答する
                  </Button>
                </Group>
              </>
            )}

            {completed && feedback && (
              <>
                <Divider />
                <Text size="sm" fw={600}>
                  通しのフィードバック
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    具体性:{" "}
                  </Text>
                  {feedback.specificity}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    長さ・構成:{" "}
                  </Text>
                  {feedback.length}
                </Text>
                {feedback.weaknesses.length > 0 && (
                  <div>
                    <Text size="sm" fw={600} mb={4}>
                      改善点
                    </Text>
                    <List size="sm" spacing={4}>
                      {feedback.weaknesses.map((w, i) => (
                        <List.Item key={i}>{w}</List.Item>
                      ))}
                    </List>
                  </div>
                )}
                <Text size="sm" c="dimmed" fs="italic">
                  {feedback.summary}
                </Text>
              </>
            )}
          </Stack>
        </Paper>
      )}

      <Divider label="1問だけの練習" labelPosition="left" />

      {questions.length > 0 ? (
        <InterviewRehearsalSection questions={questions} />
      ) : (
        <Text size="sm" c="dimmed">
          1問練習は、面談準備で想定質問を作ったあとに使えます。通し練習は対策パックだけでも開始できます。
        </Text>
      )}
    </Stack>
  );
}
