"use client";

import { useState } from "react";
import {
  Stack,
  Group,
  Button,
  Textarea,
  Select,
  Paper,
  Title,
  Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Project, InterviewNote } from "@/db/schema";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  type ProjectStatus,
} from "@/types/project";
import { saveInterviewNote } from "@/app/dashboard/projects/interview-notes-action";

interface InterviewNoteTabProps {
  project: Project;
  note: InterviewNote | null;
}

const TEMPERATURE_OPTIONS = [
  { value: "very_positive", label: "◎ かなり前向き" },
  { value: "positive", label: "○ 前向き" },
  { value: "neutral", label: "△ 中立" },
  { value: "negative", label: "× あまり前向きでない" },
];

const RESULT_STATUS_OPTIONS = (
  [
    "document_screening",
    "interview_scheduling",
    "interview_scheduled",
    "waiting_result",
    "on_hold",
    "closed",
  ] as ProjectStatus[]
).map((s) => ({ value: s, label: STATUS_LABELS[s] }));

export function InterviewNoteTab({ project, note }: InterviewNoteTabProps) {
  const [form, setForm] = useState({
    duringNote: note?.duringNote ?? "",
    afterNote: note?.afterNote ?? "",
    impression: note?.impression ?? "",
    ownTemperature: note?.ownTemperature ?? "",
    concern: note?.concern ?? "",
    nextAction: note?.nextAction ?? "",
    resultStatus: note?.resultStatus ?? "",
  });
  const [saving, setSaving] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveInterviewNote(project.id, form);
    setSaving(false);
    if (result.success) {
      notifications.show({ color: "green", message: "面談メモを保存しました" });
    } else {
      notifications.show({
        color: "red",
        message: result.error ?? "保存に失敗しました",
      });
    }
  }

  return (
    <Stack gap="md" p="md">
      <Paper withBorder p="md" radius="md">
        <Title order={5} mb="sm">
          面談中メモ
        </Title>
        <Textarea
          placeholder="面談中に気になったこと、深掘りされた点など..."
          rows={5}
          value={form.duringNote}
          onChange={(e) => update("duringNote", e.target.value)}
        />
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={5} mb="sm">
          面談後メモ
        </Title>
        <Stack gap="sm">
          <Textarea
            label="先方の印象"
            placeholder="担当者の雰囲気、チームの様子など..."
            rows={3}
            value={form.impression}
            onChange={(e) => update("impression", e.target.value)}
          />
          <Select
            label="自分の温度感"
            placeholder="選択してください"
            data={TEMPERATURE_OPTIONS}
            value={form.ownTemperature || null}
            onChange={(v) => update("ownTemperature", v ?? "")}
            clearable
          />
          <Textarea
            label="懸念点"
            placeholder="気になった点、リスク、確認したい事項..."
            rows={3}
            value={form.concern}
            onChange={(e) => update("concern", e.target.value)}
          />
          <Textarea
            label="次アクション"
            placeholder="結果連絡を待つ、書類を送る、日程を確認するなど..."
            rows={2}
            value={form.nextAction}
            onChange={(e) => update("nextAction", e.target.value)}
          />
          <Select
            label="結果ステータス"
            placeholder="面談後の案件状況"
            data={RESULT_STATUS_OPTIONS}
            value={form.resultStatus || null}
            onChange={(v) => update("resultStatus", v ?? "")}
            clearable
          />
        </Stack>
      </Paper>

      {form.resultStatus && (
        <Group>
          <Badge
            size="sm"
            variant="filled"
            color={STATUS_COLORS[form.resultStatus as ProjectStatus] ?? "gray"}
          >
            {STATUS_LABELS[form.resultStatus as ProjectStatus] ?? form.resultStatus}
          </Badge>
        </Group>
      )}

      <Group justify="flex-end">
        <Button loading={saving} onClick={handleSave}>
          保存
        </Button>
      </Group>
    </Stack>
  );
}
