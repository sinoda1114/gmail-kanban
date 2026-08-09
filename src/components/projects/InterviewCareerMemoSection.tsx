"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  Button,
  Textarea,
  MultiSelect,
  Paper,
  Title,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles } from "@tabler/icons-react";
import type { InterviewQuestion, InterviewAnswer } from "@/db/schema";
import { PRIORITY_LABELS, type Priority } from "@/types/interview-prep";
import {
  saveCareerMemo,
  personalizeInterviewAnswers,
} from "@/app/dashboard/projects/interview-personalize-action";

interface QuestionWithAnswer extends InterviewQuestion {
  answer: InterviewAnswer | null;
}

interface InterviewCareerMemoSectionProps {
  projectId: string;
  initialCareerMemo: string | null;
  questions: QuestionWithAnswer[];
  userAnswers: Record<string, string>;
}

export function InterviewCareerMemoSection({
  projectId,
  initialCareerMemo,
  questions,
  userAnswers,
}: InterviewCareerMemoSectionProps) {
  const router = useRouter();
  const [careerMemo, setCareerMemo] = useState(initialCareerMemo ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    questions.filter((q) => q.priority === "high").map((q) => q.id)
  );
  const [savingMemo, setSavingMemo] = useState(false);
  const [personalizing, setPersonalizing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const questionOptions = questions.map((q, i) => ({
    value: q.id,
    label: `Q${i + 1}. ${q.question.slice(0, 60)}${q.question.length > 60 ? "…" : ""} [${PRIORITY_LABELS[q.priority as Priority] ?? q.priority}]`,
  }));

  const hasExistingAnswers = selectedIds.some(
    (id) => (userAnswers[id] ?? "").trim().length > 0
  );

  async function handleSaveMemo() {
    setSavingMemo(true);
    const result = await saveCareerMemo(projectId, careerMemo);
    setSavingMemo(false);
    if (result.success) {
      notifications.show({ color: "green", message: "経歴メモを保存しました" });
    } else {
      notifications.show({
        color: "red",
        message: result.error ?? "保存に失敗しました",
      });
    }
  }

  async function runPersonalize() {
    setPersonalizing(true);
    const result = await personalizeInterviewAnswers(
      projectId,
      careerMemo,
      selectedIds
    );
    setPersonalizing(false);
    setConfirmOpen(false);

    if (result.success) {
      router.refresh();
      notifications.show({
        color: "teal",
        title: "パーソナライズ完了",
        message: `${result.updatedCount ?? 0}件の回答を更新しました（AI回答案はそのまま保持）`,
      });
    } else {
      notifications.show({
        color: "red",
        message: result.error ?? "パーソナライズに失敗しました",
      });
    }
  }

  function handlePersonalizeClick() {
    if (!careerMemo.trim()) {
      notifications.show({
        color: "yellow",
        message: "経歴・強みメモを入力してください",
      });
      return;
    }
    if (selectedIds.length === 0) {
      notifications.show({
        color: "yellow",
        message: "対象の質問を1件以上選択してください",
      });
      return;
    }
    if (hasExistingAnswers) {
      setConfirmOpen(true);
      return;
    }
    void runPersonalize();
  }

  return (
    <>
      <Paper withBorder p="md" radius="md">
        <Title order={5} mb="sm">
          経歴メモで回答をパーソナライズ
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          経歴・強みメモと案件情報だけを根拠に、想定質問の「自分の回答」をAIが書き直します。メモにない経験は使いません。
        </Text>
        <Stack gap="sm">
          <Textarea
            label="経歴・強みメモ"
            placeholder="これまでの経験、得意技術、実績、強みなどを自由に貼り付け..."
            rows={5}
            value={careerMemo}
            onChange={(e) => setCareerMemo(e.target.value)}
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              size="sm"
              loading={savingMemo}
              onClick={handleSaveMemo}
            >
              メモを保存
            </Button>
          </Group>
          <MultiSelect
            label="パーソナライズ対象の質問"
            placeholder="質問を選択（デフォルト: 重要）"
            data={questionOptions}
            value={selectedIds}
            onChange={setSelectedIds}
            searchable
            clearable
          />
          <Button
            variant="light"
            color="violet"
            leftSection={<IconSparkles size={16} />}
            loading={personalizing}
            onClick={handlePersonalizeClick}
          >
            選択した質問の回答をパーソナライズ
          </Button>
        </Stack>
      </Paper>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="既存の回答を上書きしますか？"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            選択した質問のうち、既に「自分の回答」が入力されているものがあります。パーソナライズ結果で上書きします。AI回答案は変更されません。
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>
              キャンセル
            </Button>
            <Button color="violet" loading={personalizing} onClick={runPersonalize}>
              上書きして実行
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
