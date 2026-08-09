"use client";

import { useState } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  Textarea,
  Select,
  Paper,
  Title,
  Badge,
  List,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMessageCircle } from "@tabler/icons-react";
import type { InterviewQuestion, InterviewAnswer } from "@/db/schema";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type Priority,
  type RehearsalFeedback,
} from "@/types/interview-prep";
import { getRehearsalFeedback } from "@/app/dashboard/projects/interview-rehearsal-action";

interface QuestionWithAnswer extends InterviewQuestion {
  answer: InterviewAnswer | null;
}

interface InterviewRehearsalSectionProps {
  questions: QuestionWithAnswer[];
}

export function InterviewRehearsalSection({
  questions,
}: InterviewRehearsalSectionProps) {
  const highPriority = questions.filter((q) => q.priority === "high");
  const targetQuestions = highPriority.length > 0 ? highPriority : questions;

  const [selectedId, setSelectedId] = useState<string | null>(
    targetQuestions[0]?.id ?? null
  );
  const [draftAnswer, setDraftAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<RehearsalFeedback | null>(null);

  const selectedQuestion = targetQuestions.find((q) => q.id === selectedId);

  const selectData = targetQuestions.map((q) => ({
    value: q.id,
    label: `Q${questions.indexOf(q) + 1}. ${q.question.slice(0, 50)}${q.question.length > 50 ? "…" : ""}`,
  }));

  async function handleGetFeedback() {
    if (!selectedId) {
      notifications.show({ color: "yellow", message: "質問を選択してください" });
      return;
    }
    if (!draftAnswer.trim()) {
      notifications.show({ color: "yellow", message: "回答を入力してください" });
      return;
    }

    setLoading(true);
    setFeedback(null);
    const result = await getRehearsalFeedback(selectedId, draftAnswer);
    setLoading(false);

    if (result.success && result.feedback) {
      setFeedback(result.feedback);
    } else {
      notifications.show({
        color: "red",
        message: result.error ?? "フィードバック取得に失敗しました",
      });
    }
  }

  if (questions.length === 0) return null;

  return (
    <Paper withBorder p="md" radius="md">
      <Group gap="xs" mb="sm">
        <Title order={5}>模擬回答リハーサル</Title>
        {highPriority.length > 0 && (
          <Badge size="sm" color="red" variant="light">
            重要質問のみ
          </Badge>
        )}
      </Group>
      <Text size="sm" c="dimmed" mb="sm">
        質問を選び、自分の言葉で回答を書いてからAIフィードバックを受け取れます（テキストのみ）。
      </Text>
      <Stack gap="sm">
        <Select
          label="練習する質問"
          data={selectData}
          value={selectedId}
          onChange={(v) => {
            setSelectedId(v);
            setFeedback(null);
          }}
          searchable
        />
        {selectedQuestion && (
          <Paper withBorder p="sm" radius="sm" bg="gray.0">
            <Group gap="xs" mb={4}>
              <Badge
                size="xs"
                variant="dot"
                color={
                  PRIORITY_COLORS[selectedQuestion.priority as Priority] ??
                  "gray"
                }
              >
                {PRIORITY_LABELS[selectedQuestion.priority as Priority] ??
                  selectedQuestion.priority}
              </Badge>
            </Group>
            <Text size="sm" fw={500}>
              {selectedQuestion.question}
            </Text>
          </Paper>
        )}
        <Textarea
          label="あなたの回答（練習用）"
          placeholder="面談で話すつもりで回答を書いてください..."
          rows={5}
          value={draftAnswer}
          onChange={(e) => setDraftAnswer(e.target.value)}
        />
        <Group justify="flex-end">
          <Button
            variant="light"
            color="teal"
            leftSection={<IconMessageCircle size={16} />}
            loading={loading}
            onClick={handleGetFeedback}
          >
            フィードバックを取得
          </Button>
        </Group>

        {feedback && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                AIフィードバック
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
                    {feedback.weaknesses.map((w: string, i: number) => (
                      <List.Item key={i}>{w}</List.Item>
                    ))}
                  </List>
                </div>
              )}
              <Text size="sm" c="dimmed" fs="italic">
                {feedback.summary}
              </Text>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
