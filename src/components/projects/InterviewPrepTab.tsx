"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  Button,
  TextInput,
  Textarea,
  Select,
  Badge,
  Paper,
  Checkbox,
  Accordion,
  Alert,
  Divider,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles } from "@tabler/icons-react";
import type {
  Project,
  InterviewPreparation,
  InterviewQuestion,
  InterviewAnswer,
  InterviewReverseQuestion,
} from "@/db/schema";
import {
  QUESTION_CATEGORY_LABELS,
  QUESTION_CATEGORY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  REVERSE_CATEGORY_LABELS,
  type QuestionCategory,
  type Priority,
  type ReverseQuestionCategory,
} from "@/types/interview-prep";
import {
  saveInterviewInfo,
  generateInterviewPrep,
  updateInterviewAnswer,
  toggleReverseQuestionChecked,
} from "@/app/dashboard/projects/interview-prep-action";

interface QuestionWithAnswer extends InterviewQuestion {
  answer: InterviewAnswer | null;
}

interface InterviewPrepTabProps {
  project: Project;
  prep: InterviewPreparation | null;
  questions: QuestionWithAnswer[];
  reverseQuestions: InterviewReverseQuestion[];
}

type InfoForm = {
  interviewAt: string;
  interviewUrl: string;
  interviewType: string;
  interviewPartner: string;
};

export function InterviewPrepTab({
  project,
  prep,
  questions: initialQuestions,
  reverseQuestions: initialReverseQs,
}: InterviewPrepTabProps) {
  const router = useRouter();
  const [infoForm, setInfoForm] = useState<InfoForm>({
    interviewAt: prep?.interviewAt ?? "",
    interviewUrl: prep?.interviewUrl ?? "",
    interviewType: prep?.interviewType ?? "online",
    interviewPartner: prep?.interviewPartner ?? "",
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      initialQuestions.map((q) => [q.id, q.answer?.userAnswer ?? ""])
    )
  );
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(initialReverseQs.filter((rq) => rq.checked).map((rq) => rq.id))
  );

  const hasGenerated = initialQuestions.length > 0;

  async function handleSaveInfo() {
    setInfoSaving(true);
    const result = await saveInterviewInfo(project.id, infoForm);
    setInfoSaving(false);
    if (result.success) {
      notifications.show({ color: "green", message: "面談情報を保存しました" });
    } else {
      notifications.show({
        color: "red",
        message: result.error ?? "保存に失敗しました",
      });
    }
  }

  async function handleGenerate() {
    setAiLoading(true);
    setError(null);
    const saveResult = await saveInterviewInfo(project.id, infoForm);
    if (!saveResult.success) {
      setError(saveResult.error ?? "面談情報の保存に失敗しました");
      setAiLoading(false);
      return;
    }
    const result = await generateInterviewPrep(project.id);
    setAiLoading(false);
    if (result.success) {
      router.refresh();
      notifications.show({
        color: "teal",
        title: "AI面談準備完了",
        message: "想定質問・逆質問・面談戦略を生成しました。",
      });
    } else {
      setError(result.error ?? "AI処理に失敗しました");
    }
  }

  async function handleSaveAnswer(questionId: string) {
    setSavingAnswerId(questionId);
    const result = await updateInterviewAnswer(questionId, userAnswers[questionId] ?? "");
    setSavingAnswerId(null);
    if (!result.success) {
      notifications.show({ color: "red", message: result.error ?? "保存に失敗しました" });
    } else {
      notifications.show({ color: "green", message: "回答を保存しました" });
    }
  }

  async function handleToggleReverse(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    const result = await toggleReverseQuestionChecked(id);
    if (!result.success) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }

  const reverseByCategory = REVERSE_CATEGORY_LABELS
    ? (Object.keys(REVERSE_CATEGORY_LABELS) as ReverseQuestionCategory[]).reduce(
        (acc, cat) => {
          acc[cat] = initialReverseQs.filter((rq) => rq.category === cat);
          return acc;
        },
        {} as Record<ReverseQuestionCategory, InterviewReverseQuestion[]>
      )
    : ({} as Record<ReverseQuestionCategory, InterviewReverseQuestion[]>);

  return (
    <Stack gap="md" p="md">
      {error && (
        <Alert color="red" title="エラー">
          {error}
        </Alert>
      )}

      {/* 面談情報 */}
      <Paper withBorder p="md" radius="md">
        <Title order={5} mb="sm">
          面談情報
        </Title>
        <Stack gap="sm">
          <TextInput
            label="面談日時"
            placeholder="例: 2026-07-01 14:00"
            value={infoForm.interviewAt}
            onChange={(e) =>
              setInfoForm((f) => ({ ...f, interviewAt: e.target.value }))
            }
          />
          <TextInput
            label="面談URL"
            placeholder="https://meet.google.com/..."
            value={infoForm.interviewUrl}
            onChange={(e) =>
              setInfoForm((f) => ({ ...f, interviewUrl: e.target.value }))
            }
          />
          <Select
            label="面談形式"
            data={[
              { value: "online", label: "オンライン" },
              { value: "onsite", label: "対面" },
            ]}
            value={infoForm.interviewType}
            onChange={(v) =>
              setInfoForm((f) => ({ ...f, interviewType: v ?? "online" }))
            }
          />
          <TextInput
            label="面談相手"
            placeholder="例: エージェント担当者 / 企業人事"
            value={infoForm.interviewPartner}
            onChange={(e) =>
              setInfoForm((f) => ({ ...f, interviewPartner: e.target.value }))
            }
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              size="sm"
              loading={infoSaving}
              onClick={handleSaveInfo}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* AI生成ボタン */}
      <Button
        variant="light"
        color="violet"
        leftSection={<IconSparkles size={16} />}
        loading={aiLoading}
        onClick={handleGenerate}
        fullWidth
      >
        {hasGenerated ? "AIで面談準備を再生成" : "AIで面談準備を一括作成"}
      </Button>

      {hasGenerated && (
        <>
          <Divider />

          {/* 想定質問 */}
          <div>
            <Title order={5} mb="sm">
              想定質問 ({initialQuestions.length}件)
            </Title>
            <Accordion variant="separated">
              {initialQuestions.map((q, i) => (
                <Accordion.Item key={q.id} value={q.id}>
                  <Accordion.Control>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={500} style={{ flex: 1 }}>
                        Q{i + 1}. {q.question}
                      </Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color={
                          QUESTION_CATEGORY_COLORS[
                            q.category as QuestionCategory
                          ] ?? "gray"
                        }
                      >
                        {QUESTION_CATEGORY_LABELS[
                          q.category as QuestionCategory
                        ] ?? q.category}
                      </Badge>
                      <Badge
                        size="xs"
                        variant="dot"
                        color={
                          PRIORITY_COLORS[q.priority as Priority] ?? "gray"
                        }
                      >
                        {PRIORITY_LABELS[q.priority as Priority] ?? q.priority}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      {q.answer?.aiAnswer && (
                        <Paper
                          withBorder
                          p="sm"
                          radius="sm"
                          style={{ borderColor: "var(--mantine-color-violet-3)" }}
                        >
                          <Text size="xs" c="violet.6" fw={600} mb={4}>
                            AI回答案
                          </Text>
                          <Text size="sm">{q.answer.aiAnswer}</Text>
                        </Paper>
                      )}
                      <Textarea
                        label="自分の回答"
                        placeholder="自分用の回答をメモ..."
                        rows={3}
                        value={userAnswers[q.id] ?? ""}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                      />
                      <Group justify="flex-end">
                        <Button
                          size="xs"
                          variant="default"
                          loading={savingAnswerId === q.id}
                          onClick={() => handleSaveAnswer(q.id)}
                        >
                          保存
                        </Button>
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>

          {/* 逆質問 */}
          {initialReverseQs.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                逆質問
              </Title>
              <Stack gap="sm">
                {(
                  Object.keys(REVERSE_CATEGORY_LABELS) as ReverseQuestionCategory[]
                )
                  .filter((cat) => (reverseByCategory[cat] ?? []).length > 0)
                  .map((cat) => (
                    <Paper key={cat} withBorder p="sm" radius="md">
                      <Text size="xs" fw={600} c="dimmed" mb="xs">
                        {REVERSE_CATEGORY_LABELS[cat]}
                      </Text>
                      <Stack gap="xs">
                        {(reverseByCategory[cat] ?? []).map((rq) => (
                          <Checkbox
                            key={rq.id}
                            label={rq.question}
                            checked={checkedIds.has(rq.id)}
                            onChange={() => handleToggleReverse(rq.id)}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  ))}
              </Stack>
            </div>
          )}

          {/* 面談戦略 */}
          {prep?.strategy && (
            <div>
              <Title order={5} mb="sm">
                面談戦略
              </Title>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {prep.strategy}
                </Text>
              </Paper>
            </div>
          )}

          {/* 懸念点 */}
          {prep?.concerns && prep.concerns.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                懸念点・確認事項
              </Title>
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{ borderColor: "var(--mantine-color-yellow-5)" }}
              >
                <Stack gap={4}>
                  {prep.concerns.map((c, i) => (
                    <Text key={i} size="sm">
                      ・{c}
                    </Text>
                  ))}
                </Stack>
              </Paper>
            </div>
          )}

          {/* チェックリスト */}
          {prep?.checklist && prep.checklist.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                面談前チェックリスト
              </Title>
              <Paper withBorder p="sm" radius="md">
                <Stack gap="xs">
                  {prep.checklist.map((item, i) => (
                    <Text key={i} size="sm">
                      ☐ {item}
                    </Text>
                  ))}
                </Stack>
              </Paper>
            </div>
          )}
        </>
      )}
    </Stack>
  );
}
