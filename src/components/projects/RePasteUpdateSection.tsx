"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  Button,
  Textarea,
  Paper,
  Title,
  Alert,
  Checkbox,
  Table,
  Badge,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles } from "@tabler/icons-react";
import type { Project } from "@/db/schema";
import type { ProjectExtraction } from "@/types/ai";
import { STATUS_LABELS, type ProjectStatus } from "@/types/project";
import {
  extractProjectUpdateFromText,
  applyAcceptedProjectUpdates,
  type AcceptedProjectUpdateFields,
} from "@/app/dashboard/projects/re-paste-action";

const REMOTE_TYPE_LABELS: Record<string, string> = {
  full_remote: "フルリモート",
  partial_remote: "一部リモート",
  on_site: "常駐",
};

type FieldKey = keyof AcceptedProjectUpdateFields;

type ProposedChange = {
  key: FieldKey;
  label: string;
  current: string;
  proposed: string;
};

function formatValue(value: string | string[] | null | undefined): string {
  if (value === null || value === undefined) return "（なし）";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "（なし）";
  }
  const trimmed = value.trim();
  return trimmed || "（なし）";
}

function formatRemoteType(value: string | null | undefined): string {
  if (!value) return "（なし）";
  return REMOTE_TYPE_LABELS[value] ?? value;
}

function buildProposedChanges(
  project: Project,
  extraction: ProjectExtraction,
  newSourceText: string
): ProposedChange[] {
  const changes: ProposedChange[] = [];

  const addChange = (
    key: FieldKey,
    label: string,
    current: string,
    proposed: string | undefined,
    formatter: (v: string) => string = (v) => v
  ) => {
    if (proposed === undefined) return;
    const currentFormatted = formatter(current);
    const proposedFormatted = formatter(proposed);
    if (currentFormatted !== proposedFormatted) {
      changes.push({
        key,
        label,
        current: currentFormatted,
        proposed: proposedFormatted,
      });
    }
  };

  addChange("title", "タイトル", project.title, extraction.title);
  addChange(
    "agentCompany",
    "エージェント会社",
    project.agentCompany ?? "",
    extraction.agentCompany
  );
  addChange(
    "agentPerson",
    "担当者",
    project.agentPerson ?? "",
    extraction.agentPerson
  );
  addChange("summary", "サマリー", project.summary ?? "", extraction.summary);
  addChange("price", "単価", project.price ?? "", extraction.price);
  addChange("workRate", "稼働率", project.workRate ?? "", extraction.workRate);
  addChange("location", "勤務地", project.location ?? "", extraction.location);
  addChange(
    "remoteType",
    "リモート区分",
    project.remoteType ?? "",
    extraction.remoteType,
    formatRemoteType
  );
  addChange(
    "techStack",
    "技術スタック",
    formatValue(project.techStack),
    extraction.techStack ? formatValue(extraction.techStack) : undefined
  );
  addChange(
    "startDateText",
    "開始時期",
    project.startDateText ?? "",
    extraction.startDateText
  );
  addChange(
    "contractPeriod",
    "契約期間",
    project.contractPeriod ?? "",
    extraction.contractPeriod
  );
  addChange(
    "nextAction",
    "次のアクション",
    project.nextAction ?? "",
    extraction.suggestedNextAction
  );
  addChange(
    "status",
    "ステータス",
    STATUS_LABELS[project.status as ProjectStatus] ?? project.status,
    extraction.suggestedStatus
      ? (STATUS_LABELS[extraction.suggestedStatus as ProjectStatus] ??
          extraction.suggestedStatus)
      : undefined
  );

  const trimmedSource = newSourceText.trim();
  if (trimmedSource && trimmedSource !== (project.sourceText ?? "").trim()) {
    changes.push({
      key: "sourceText",
      label: "メール本文",
      current:
        (project.sourceText ?? "").length > 80
          ? `${(project.sourceText ?? "").slice(0, 80)}…`
          : formatValue(project.sourceText),
      proposed:
        trimmedSource.length > 80
          ? `${trimmedSource.slice(0, 80)}…`
          : trimmedSource,
    });
  }

  return changes;
}

interface RePasteUpdateSectionProps {
  project: Project;
}

export function RePasteUpdateSection({ project }: RePasteUpdateSectionProps) {
  const router = useRouter();
  const [newSourceText, setNewSourceText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ProjectExtraction | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<AcceptedProjectUpdateFields>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const proposedChanges = useMemo(() => {
    if (!extraction) return [];
    return buildProposedChanges(project, extraction, newSourceText);
  }, [project, extraction, newSourceText]);

  async function handleExtract() {
    if (!newSourceText.trim()) {
      setError("新しいメール本文を貼り付けてください");
      return;
    }
    setAiLoading(true);
    setError(null);
    setExtraction(null);
    setConcerns([]);
    setAccepted({});

    const result = await extractProjectUpdateFromText(
      project.id,
      newSourceText
    );
    setAiLoading(false);

    if (!result.success || !result.data) {
      setError(result.error ?? "AI処理に失敗しました");
      return;
    }

    const changes = buildProposedChanges(project, result.data, newSourceText);
    if (changes.length === 0) {
      setError("既存情報と差分は検出されませんでした");
      setExtraction(result.data);
      setConcerns(result.data.concerns ?? []);
      return;
    }

    setExtraction(result.data);
    setConcerns(result.data.concerns ?? []);
    setAccepted(
      Object.fromEntries(changes.map((c) => [c.key, true])) as AcceptedProjectUpdateFields
    );
    notifications.show({
      color: "teal",
      title: "差分抽出完了",
      message: `${changes.length}件の更新候補を検出しました。適用する項目を確認してください。`,
    });
  }

  function toggleField(key: FieldKey, checked: boolean) {
    setAccepted((prev: AcceptedProjectUpdateFields) => ({
      ...prev,
      [key]: checked,
    }));
  }

  function toggleAll(checked: boolean) {
    setAccepted(
      Object.fromEntries(
        proposedChanges.map((c) => [c.key, checked])
      ) as AcceptedProjectUpdateFields
    );
  }

  async function handleApply() {
    if (!extraction) return;
    const selectedCount = proposedChanges.filter((c) => accepted[c.key]).length;
    if (selectedCount === 0) {
      setError("更新する項目を1つ以上選択してください");
      return;
    }

    setApplying(true);
    const result = await applyAcceptedProjectUpdates(
      project.id,
      newSourceText,
      extraction,
      accepted
    );
    setApplying(false);
    setConfirmOpen(false);

    if (result.success) {
      notifications.show({
        color: "green",
        message: `${selectedCount}件の項目を更新しました`,
      });
      setNewSourceText("");
      setExtraction(null);
      setConcerns([]);
      setAccepted({});
      router.refresh();
    } else {
      setError(result.error ?? "更新に失敗しました");
    }
  }

  const selectedCount = proposedChanges.filter((c) => accepted[c.key]).length;

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={5} mb="sm">
        メール再貼り付けで更新
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        新しいメール本文を貼り付けてAIで差分を抽出し、適用する項目だけを選んで更新できます。
      </Text>

      {error && (
        <Alert color="red" title="エラー" mb="sm">
          {error}
        </Alert>
      )}

      <Stack gap="sm">
        <Textarea
          label="新しいメール本文"
          placeholder="エージェントから届いた最新メールをここに貼り付け"
          rows={6}
          value={newSourceText}
          onChange={(e) => setNewSourceText(e.target.value)}
        />
        <Group justify="flex-end">
          <Button
            variant="light"
            color="violet"
            leftSection={<IconSparkles size={16} />}
            loading={aiLoading}
            onClick={handleExtract}
          >
            AIで差分抽出
          </Button>
        </Group>

        {concerns.length > 0 && (
          <Paper
            withBorder
            p="sm"
            radius="md"
            style={{ borderColor: "var(--mantine-color-yellow-5)" }}
          >
            <Text size="sm" fw={600} mb="xs" c="yellow.7">
              AI が検出した確認事項
            </Text>
            <Stack gap={4}>
              {concerns.map((c, i) => (
                <Text key={i} size="sm">
                  ・{c}
                </Text>
              ))}
            </Stack>
          </Paper>
        )}

        {proposedChanges.length > 0 && (
          <>
            <Group justify="space-between">
              <Text size="sm" fw={600}>
                更新候補 ({proposedChanges.length}件)
              </Text>
              <Group gap="xs">
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => toggleAll(true)}
                >
                  すべて選択
                </Button>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => toggleAll(false)}
                >
                  選択解除
                </Button>
              </Group>
            </Group>

            <Table withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={40} />
                  <Table.Th>項目</Table.Th>
                  <Table.Th>現在</Table.Th>
                  <Table.Th>→</Table.Th>
                  <Table.Th>提案</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {proposedChanges.map((change) => (
                  <Table.Tr key={change.key as string}>
                    <Table.Td>
                      <Checkbox
                        checked={!!accepted[change.key]}
                        onChange={(e) =>
                          toggleField(change.key, e.currentTarget.checked)
                        }
                        aria-label={`${change.label}を更新`}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {change.label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                        {change.current}
                      </Text>
                    </Table.Td>
                    <Table.Td>→</Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {change.proposed}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Group justify="flex-end">
              <Badge variant="light" color="violet">
                {selectedCount}件選択中
              </Badge>
              <Button
                color="teal"
                disabled={selectedCount === 0}
                onClick={() => setConfirmOpen(true)}
              >
                選択した項目を適用
              </Button>
            </Group>
          </>
        )}
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="更新内容の確認"
      >
        <Stack gap="sm">
          <Text size="sm">
            選択した {selectedCount} 件の項目を案件情報に反映します。よろしいですか？
          </Text>
          <Text size="xs" c="dimmed">
            この操作は取り消せません。適用後も編集画面から個別に修正できます。
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>
              キャンセル
            </Button>
            <Button color="teal" loading={applying} onClick={handleApply}>
              適用する
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
