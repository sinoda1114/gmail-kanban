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
 * メールURL → 本文取得 →（任意）AI整理 の一連導線。
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
    <Stack gap="md">
      <Stack gap={4}>
        <Text size="sm" fw={600}>
          メールから取り込む
        </Text>
        <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
          ① メールのURLを貼る
          <br />
          ②「本文を取得」を押す
          <br />
          ③「AIで整理する」か、手入力で進める
        </Text>
      </Stack>

      <div>
        <TextInput
          label="メールのURL"
          description="mail.google.com のメールURL（英数字ID）。FMfcgz形式は取得不可のため本文を直接貼ってください"
          placeholder="https://mail.google.com/mail/u/0/#inbox/18c2f3a1b2d4e5f6"
          value={gmailUrl}
          onChange={(e) => onGmailUrlChange(e.currentTarget.value)}
        />
        <Group mt="xs" justify="flex-end">
          <Button
            variant="light"
            leftSection={<IconMail size={16} />}
            loading={gmailLoading}
            onClick={onFetchGmail}
            type="button"
            disabled={!gmailUrl.trim()}
          >
            本文を取得
          </Button>
        </Group>
      </div>

      <div>
        <Textarea
          label="メール本文"
          rows={sourceRows}
          placeholder="上の「本文を取得」で反映。または募集要項を直接貼り付け"
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
