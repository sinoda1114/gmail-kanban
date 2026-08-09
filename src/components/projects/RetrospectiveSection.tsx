"use client";

import { useState } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  Textarea,
  Paper,
  Title,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles, IconCopy, IconDeviceFloppy } from "@tabler/icons-react";
import type { Project, InterviewNote } from "@/db/schema";
import type { InterviewRetrospective } from "@/types/retrospective";
import {
  generateRetrospective,
  saveRetrospective,
} from "@/app/dashboard/projects/retrospective-action";

interface RetrospectiveSectionProps {
  project: Project;
  note: InterviewNote | null;
  currentNotes?: {
    duringNote?: string;
    afterNote?: string;
    impression?: string;
    ownTemperature?: string;
    concern?: string;
    nextAction?: string;
  };
}

const EMPTY_RETROSPECTIVE: InterviewRetrospective = {
  wentWell: "",
  likelyFollowUps: "",
  temperatureAssessment: "",
  nextPrepTips: "",
};

function formatRetrospectiveForCopy(r: InterviewRetrospective): string {
  return [
    "【うまくいったこと】",
    r.wentWell,
    "",
    "【想定フォローアップ】",
    r.likelyFollowUps,
    "",
    "【温度感】",
    r.temperatureAssessment,
    "",
    "【次回準備のヒント】",
    r.nextPrepTips,
  ].join("\n");
}

function noteHasContent(
  note: InterviewNote | null,
  currentNotes?: RetrospectiveSectionProps["currentNotes"]
): boolean {
  const fields = [
    currentNotes?.duringNote ?? note?.duringNote,
    currentNotes?.afterNote ?? note?.afterNote,
    currentNotes?.impression ?? note?.impression,
    currentNotes?.concern ?? note?.concern,
    currentNotes?.nextAction ?? note?.nextAction,
    currentNotes?.ownTemperature ?? note?.ownTemperature,
  ];
  return fields.some((v) => v?.trim());
}

export function RetrospectiveSection({
  project,
  note,
  currentNotes,
}: RetrospectiveSectionProps) {
  const [retrospective, setRetrospective] = useState<InterviewRetrospective>(
    note?.retrospective ?? EMPTY_RETROSPECTIVE
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasNotes = noteHasContent(note, currentNotes);
  const hasRetrospective = Object.values(retrospective).some((v) => v.trim());

  function updateField(key: keyof InterviewRetrospective, value: string) {
    setRetrospective((r) => ({ ...r, [key]: value }));
  }

  async function handleGenerate() {
    if (!hasNotes) {
      setError(
        "面談メモが空です。メモを入力してから振り返りを生成してください。"
      );
      return;
    }

    setAiLoading(true);
    setError(null);
    const result = await generateRetrospective(project.id, currentNotes);
    setAiLoading(false);

    if (!result.success) {
      setError(result.error ?? "AI処理に失敗しました");
      return;
    }

    if (result.retrospective) {
      setRetrospective(result.retrospective);
      notifications.show({
        color: "teal",
        title: "振り返り生成完了",
        message: "内容を確認し、必要に応じて編集・保存してください。",
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveRetrospective(project.id, retrospective);
    setSaving(false);

    if (result.success) {
      notifications.show({ color: "green", message: "振り返りを保存しました" });
    } else {
      notifications.show({
        color: "red",
        message: result.error ?? "保存に失敗しました",
      });
    }
  }

  async function handleCopy() {
    if (!hasRetrospective) return;
    try {
      await navigator.clipboard.writeText(
        formatRetrospectiveForCopy(retrospective)
      );
      notifications.show({
        color: "green",
        message: "クリップボードにコピーしました",
      });
    } catch {
      notifications.show({
        color: "red",
        message: "コピーに失敗しました。手動で選択してコピーしてください。",
      });
    }
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={5} mb="sm">
        面談後振り返り
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        面談メモをもとに、うまくいった点・フォローアップ・温度感・次回準備のヒントを整理します。
      </Text>

      {!hasNotes && (
        <Alert color="yellow" title="メモが未入力です" mb="sm">
          面談中・面談後メモなどを入力してから振り返りを生成してください。空のメモからは生成しません。
        </Alert>
      )}

      {error && (
        <Alert color="red" title="エラー" mb="sm">
          {error}
        </Alert>
      )}

      <Stack gap="sm">
        <Button
          variant="light"
          color="violet"
          leftSection={<IconSparkles size={16} />}
          loading={aiLoading}
          onClick={handleGenerate}
          disabled={!hasNotes}
        >
          振り返りを生成
        </Button>

        {(hasRetrospective || aiLoading) && (
          <>
            <Textarea
              label="うまくいったこと"
              rows={3}
              value={retrospective.wentWell}
              onChange={(e) => updateField("wentWell", e.target.value)}
            />
            <Textarea
              label="想定フォローアップ"
              rows={3}
              value={retrospective.likelyFollowUps}
              onChange={(e) => updateField("likelyFollowUps", e.target.value)}
            />
            <Textarea
              label="温度感"
              rows={2}
              value={retrospective.temperatureAssessment}
              onChange={(e) =>
                updateField("temperatureAssessment", e.target.value)
              }
            />
            <Textarea
              label="次回準備のヒント（この案件向け）"
              rows={4}
              value={retrospective.nextPrepTips}
              onChange={(e) => updateField("nextPrepTips", e.target.value)}
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                leftSection={<IconCopy size={16} />}
                onClick={handleCopy}
                disabled={!hasRetrospective}
              >
                クリップボードにコピー
              </Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                loading={saving}
                onClick={handleSave}
              >
                振り返りを保存
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}
