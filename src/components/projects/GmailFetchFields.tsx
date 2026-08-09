"use client";

import { Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { IconMail, IconSparkles } from "@tabler/icons-react";

type Props = {
  gmailInput: string;
  sourceText: string;
  onGmailInputChange: (value: string) => void;
  onSourceTextChange: (value: string) => void;
  onFetchGmail: () => void;
  gmailLoading?: boolean;
  onAiExtract?: () => void;
  aiLoading?: boolean;
  sourceRows?: number;
};

export function GmailFetchFields({
  gmailInput,
  sourceText,
  onGmailInputChange,
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
          Gmail から取得
        </Text>
        <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
          ① Gmail の URL またはスレッド ID を貼る
          <br />
          ②「Gmailから取得」を押す
          <br />
          ③「AIで整理する」か、手入力で進める（手動ペーストも引き続き利用できます）
        </Text>
      </Stack>

      <div>
        <TextInput
          label="Gmail URL / スレッド ID"
          description="mail.google.com のメール URL（英数字 ID）または API 用スレッド ID。FMfcgz 形式は取得不可"
          placeholder="https://mail.google.com/mail/u/0/#inbox/18c2f3a1b2d4e5f6"
          value={gmailInput}
          onChange={(e) => onGmailInputChange(e.currentTarget.value)}
        />
        <Group mt="xs" justify="flex-end">
          <Button
            variant="light"
            leftSection={<IconMail size={16} />}
            loading={gmailLoading}
            onClick={onFetchGmail}
            type="button"
            disabled={!gmailInput.trim()}
          >
            Gmailから取得
          </Button>
        </Group>
      </div>

      <div>
        <Textarea
          label="メール本文"
          rows={sourceRows}
          placeholder="上の「Gmailから取得」で反映。または募集要項を直接貼り付け"
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
