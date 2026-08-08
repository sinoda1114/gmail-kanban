"use client";

import { Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { IconMail, IconSparkles } from "@tabler/icons-react";

type Props = {
  gmailUrl: string;
  sourceText: string;
  onGmailUrlChange: (value: string) => void;
  onSourceTextChange: (value: string) => void;
  onFetchGmail: () => void;
  gmailLoading?: boolean;
  /** 新規作成フォーム向け。省略時は AI ボタン非表示 */
  onAiExtract?: () => void;
  aiLoading?: boolean;
  sourceRows?: number;
};

/**
 * Gmail URL → 本文取得 →（任意）AI整理 の一連導線。
 */
export function GmailFetchFields({
  gmailUrl,
  sourceText,
  onGmailUrlChange,
  onSourceTextChange,
  onFetchGmail,
  gmailLoading = false,
  onAiExtract,
  aiLoading = false,
  sourceRows = 8,
}: Props) {
  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">
        ① Gmail URL を貼る → ② 本文取得 → ③ AIで整理（または手入力）
      </Text>

      <Group align="flex-end" gap="sm" wrap="nowrap">
        <TextInput
          style={{ flex: 1, minWidth: 0 }}
          label="Gmail URL"
          description="mail.google.com のメール個別URL"
          placeholder="https://mail.google.com/mail/u/0/#starred/..."
          value={gmailUrl}
          onChange={(e) => onGmailUrlChange(e.currentTarget.value)}
        />
        <Button
          variant="light"
          leftSection={<IconMail size={16} />}
          loading={gmailLoading}
          onClick={onFetchGmail}
          type="button"
          disabled={!gmailUrl.trim()}
          style={{ flexShrink: 0 }}
        >
          本文取得
        </Button>
      </Group>

      <div>
        <Textarea
          label="メール本文"
          rows={sourceRows}
          placeholder="上の「本文取得」で反映。または募集要項を直接ペースト"
          value={sourceText}
          onChange={(e) => onSourceTextChange(e.currentTarget.value)}
        />
        {onAiExtract && (
          <Group mt="xs" justify="flex-end">
            <Button
              variant="light"
              color="violet"
              leftSection={<IconSparkles size={16} />}
              loading={aiLoading}
              onClick={onAiExtract}
              type="button"
              disabled={!sourceText.trim()}
            >
              AIで整理する
            </Button>
          </Group>
        )}
      </div>
    </Stack>
  );
}
