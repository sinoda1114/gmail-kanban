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
import { IconSparkles, IconCopy } from "@tabler/icons-react";
import type { Project } from "@/db/schema";
import { generateReplyDraft } from "@/app/dashboard/projects/reply-draft-action";

interface ReplyDraftSectionProps {
  project: Project;
}

export function ReplyDraftSection({ project }: ReplyDraftSectionProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function handleGenerate() {
    setAiLoading(true);
    setError(null);

    const result = await generateReplyDraft(project.id);
    setAiLoading(false);

    if (!result.success || !result.draft) {
      setError(result.error ?? "AI処理に失敗しました");
      return;
    }

    setDraft(result.draft);
    notifications.show({
      color: "teal",
      title: "返信ドラフト生成完了",
      message: "内容を確認し、Gmailで手動送信してください。",
    });
  }

  async function handleCopy() {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      notifications.show({ color: "green", message: "クリップボードにコピーしました" });
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
        返信ドラフト
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        案件情報をもとに返信メールのドラフトを生成します。Gmailでの送信は手動で行ってください。
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
          返信ドラフトを生成
        </Button>

        {draft && (
          <>
            <Textarea
              label="生成されたドラフト"
              rows={10}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                leftSection={<IconCopy size={16} />}
                onClick={handleCopy}
              >
                クリップボードにコピー
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}
