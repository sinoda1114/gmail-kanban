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
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles, IconCopy } from "@tabler/icons-react";
import type { Project } from "@/db/schema";
import type { NegotiationContent, NegotiationTopic } from "@/types/negotiation";
import { generateNegotiationPhrases } from "@/app/dashboard/projects/negotiation-action";

interface NegotiationSectionProps {
  project: Project;
}

const EMPTY_TOPIC: NegotiationTopic = {
  talkingPoints: [],
  samplePhrases: [],
};

const EMPTY_CONTENT: NegotiationContent = {
  rate: { ...EMPTY_TOPIC },
  workload: { ...EMPTY_TOPIC },
  startDate: { ...EMPTY_TOPIC },
};

const TOPIC_LABELS: Record<keyof NegotiationContent, string> = {
  rate: "単価",
  workload: "稼働率",
  startDate: "開始時期",
};

function topicToText(topic: NegotiationTopic): string {
  const points =
    topic.talkingPoints.length > 0
      ? topic.talkingPoints.map((p) => `・${p}`).join("\n")
      : "";
  const phrases =
    topic.samplePhrases.length > 0
      ? topic.samplePhrases.map((p) => `「${p}」`).join("\n")
      : "";
  return [points, phrases].filter(Boolean).join("\n\n");
}

function textToTopic(text: string): NegotiationTopic {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const talkingPoints: string[] = [];
  const samplePhrases: string[] = [];

  for (const line of lines) {
    const stripped = line.replace(/^[・「]|[」]$/g, "").trim();
    if (!stripped) continue;
    if (line.startsWith("「") || line.startsWith('"')) {
      samplePhrases.push(stripped);
    } else {
      talkingPoints.push(stripped.replace(/^・/, ""));
    }
  }

  return { talkingPoints, samplePhrases };
}

function formatNegotiationForCopy(content: NegotiationContent): string {
  return (Object.keys(TOPIC_LABELS) as (keyof NegotiationContent)[])
    .map((key) => {
      const topic = content[key];
      const parts = [`【${TOPIC_LABELS[key]}】`];
      if (topic.talkingPoints.length > 0) {
        parts.push("■ 論点");
        parts.push(...topic.talkingPoints.map((p) => `・${p}`));
      }
      if (topic.samplePhrases.length > 0) {
        parts.push("■ フレーズ例");
        parts.push(...topic.samplePhrases.map((p) => `「${p}」`));
      }
      return parts.join("\n");
    })
    .join("\n\n");
}

function hasContent(content: NegotiationContent): boolean {
  return (Object.keys(content) as (keyof NegotiationContent)[]).some((key) => {
    const topic = content[key];
    return topic.talkingPoints.length > 0 || topic.samplePhrases.length > 0;
  });
}

export function NegotiationSection({ project }: NegotiationSectionProps) {
  const [content, setContent] = useState<NegotiationContent>(EMPTY_CONTENT);
  const [textFields, setTextFields] = useState<Record<keyof NegotiationContent, string>>({
    rate: "",
    workload: "",
    startDate: "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTextField(key: keyof NegotiationContent, value: string) {
    setTextFields((f) => ({ ...f, [key]: value }));
    setContent((c) => ({ ...c, [key]: textToTopic(value) }));
  }

  async function handleGenerate() {
    setAiLoading(true);
    setError(null);

    const result = await generateNegotiationPhrases(project.id);
    setAiLoading(false);

    if (!result.success) {
      setError(result.error ?? "AI処理に失敗しました");
      return;
    }

    if (result.content) {
      setContent(result.content);
      setTextFields({
        rate: topicToText(result.content.rate),
        workload: topicToText(result.content.workload),
        startDate: topicToText(result.content.startDate),
      });
      notifications.show({
        color: "teal",
        title: "交渉フレーズ生成完了",
        message: "内容を確認し、必要に応じて編集してからコピーしてください。自動送信はしません。",
      });
    }
  }

  async function handleCopy() {
    if (!hasContent(content)) return;
    try {
      await navigator.clipboard.writeText(formatNegotiationForCopy(content));
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

  const showFields = hasContent(content) || aiLoading;

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={5} mb="sm">
        条件交渉フレーズ
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        単価・稼働率・開始時期について、案件情報をもとに交渉の論点とフレーズ例を生成します。メール送信は手動で行ってください。
      </Text>

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
        >
          交渉フレーズを生成
        </Button>

        {showFields &&
          (Object.keys(TOPIC_LABELS) as (keyof NegotiationContent)[]).map(
            (key) => (
              <Stack key={key} gap="xs">
                <Divider label={TOPIC_LABELS[key]} labelPosition="left" />
                <Textarea
                  placeholder={"・論点（行頭に・）\n「フレーズ例」（「」で囲む）"}
                  rows={5}
                  value={textFields[key]}
                  onChange={(e) => updateTextField(key, e.target.value)}
                />
              </Stack>
            )
          )}

        {showFields && (
          <Group justify="flex-end">
            <Button
              variant="default"
              leftSection={<IconCopy size={16} />}
              onClick={handleCopy}
              disabled={!hasContent(content)}
            >
              クリップボードにコピー
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
