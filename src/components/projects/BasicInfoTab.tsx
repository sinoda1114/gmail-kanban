"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Title,
  Badge,
  Text,
  SimpleGrid,
  TextInput,
  Textarea,
  Select,
  Button,
  ActionIcon,
  TagsInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconTrash, IconExternalLink } from "@tabler/icons-react";
import type { Project } from "@/db/schema";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  CLOSE_REASONS,
  CLOSE_REASON_LABELS,
  type ProjectStatus,
} from "@/types/project";
import {
  updateProjectBasicInfo,
  deleteProject,
} from "@/app/dashboard/projects/actions";
import type { UpdateProjectBasicInfoInput } from "@/app/dashboard/projects/actions";

interface BasicInfoTabProps {
  project: Project;
}

function field(label: string, value: string | null | undefined) {
  if (!value) return null;
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Stack>
  );
}

export function BasicInfoTab({ project }: BasicInfoTabProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProjectBasicInfoInput>({
    title: project.title,
    agentCompany: project.agentCompany ?? "",
    agentPerson: project.agentPerson ?? "",
    status: project.status as ProjectStatus,
    closeReason: project.closeReason ?? "",
    gmailUrl: project.gmailUrl ?? "",
    price: project.price ?? "",
    workRate: project.workRate ?? "",
    location: project.location ?? "",
    remoteType: project.remoteType ?? "",
    techStack: project.techStack ?? [],
    startDateText: project.startDateText ?? "",
    contractPeriod: project.contractPeriod ?? "",
    nextAction: project.nextAction ?? "",
    reminderDate: project.reminderDate ?? "",
    lastContactAt: project.lastContactAt ?? "",
    summary: project.summary ?? "",
    sourceText: project.sourceText ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProjectBasicInfo(project.id, formData);
    setLoading(false);
    if (result.success) {
      setEditing(false);
      notifications.show({ message: "更新しました", color: "green" });
    } else {
      notifications.show({
        message: result.error ?? "更新に失敗しました",
        color: "red",
      });
    }
  };

  const cancelEdit = () => {
    setFormData({
      title: project.title,
      agentCompany: project.agentCompany ?? "",
      agentPerson: project.agentPerson ?? "",
      status: project.status as ProjectStatus,
      closeReason: project.closeReason ?? "",
      gmailUrl: project.gmailUrl ?? "",
      price: project.price ?? "",
      workRate: project.workRate ?? "",
      location: project.location ?? "",
      remoteType: project.remoteType ?? "",
      techStack: project.techStack ?? [],
      startDateText: project.startDateText ?? "",
      contractPeriod: project.contractPeriod ?? "",
      nextAction: project.nextAction ?? "",
      reminderDate: project.reminderDate ?? "",
      lastContactAt: project.lastContactAt ?? "",
      summary: project.summary ?? "",
      sourceText: project.sourceText ?? "",
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("この案件を削除しますか？この操作は取り消せません。")) {
      return;
    }
    const result = await deleteProject(project.id);
    if (result.success) {
      router.push("/dashboard");
    } else {
      notifications.show({
        message: result.error ?? "削除に失敗しました",
        color: "red",
      });
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit}>
        <Stack p="md" gap="sm">
          <TextInput
            label="タイトル"
            required
            value={formData.title ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, title: e.target.value }))
            }
          />
          <Select
            label="ステータス"
            data={PROJECT_STATUSES.map((s) => ({
              value: s,
              label: STATUS_LABELS[s],
            }))}
            value={formData.status ?? null}
            onChange={(v) =>
              setFormData((f) => ({ ...f, status: v as ProjectStatus }))
            }
          />
          {formData.status === "closed" && (
            <Select
              label="終了理由"
              data={CLOSE_REASONS.map((r) => ({
                value: r,
                label: CLOSE_REASON_LABELS[r],
              }))}
              value={formData.closeReason ?? null}
              onChange={(v) =>
                setFormData((f) => ({ ...f, closeReason: v ?? "" }))
              }
            />
          )}
          <TextInput
            label="エージェント会社"
            value={formData.agentCompany ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, agentCompany: e.target.value }))
            }
          />
          <TextInput
            label="担当者"
            value={formData.agentPerson ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, agentPerson: e.target.value }))
            }
          />
          <TextInput
            label="Gmail URL"
            value={formData.gmailUrl ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, gmailUrl: e.target.value }))
            }
          />
          <TextInput
            label="単価"
            value={formData.price ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, price: e.target.value }))
            }
          />
          <TextInput
            label="稼働率"
            value={formData.workRate ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, workRate: e.target.value }))
            }
          />
          <TextInput
            label="勤務地"
            value={formData.location ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, location: e.target.value }))
            }
          />
          <TextInput
            label="リモート区分"
            value={formData.remoteType ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, remoteType: e.target.value }))
            }
          />
          <TagsInput
            label="技術スタック"
            splitChars={[",", " ", "、"]}
            value={formData.techStack ?? []}
            onChange={(v) => setFormData((f) => ({ ...f, techStack: v }))}
          />
          <TextInput
            label="開始時期"
            value={formData.startDateText ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, startDateText: e.target.value }))
            }
          />
          <TextInput
            label="契約期間"
            value={formData.contractPeriod ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, contractPeriod: e.target.value }))
            }
          />
          <TextInput
            label="次のアクション"
            value={formData.nextAction ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, nextAction: e.target.value }))
            }
          />
          <TextInput
            label="リマインド日 (YYYY-MM-DD)"
            placeholder="YYYY-MM-DD"
            value={formData.reminderDate ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, reminderDate: e.target.value }))
            }
          />
          <TextInput
            label="最終連絡日 (YYYY-MM-DD)"
            placeholder="YYYY-MM-DD"
            value={formData.lastContactAt ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, lastContactAt: e.target.value }))
            }
          />
          <Textarea
            label="サマリー"
            rows={3}
            value={formData.summary ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, summary: e.target.value }))
            }
          />
          <Textarea
            label="メール本文"
            rows={5}
            value={formData.sourceText ?? ""}
            onChange={(e) =>
              setFormData((f) => ({ ...f, sourceText: e.target.value }))
            }
          />
          <Group>
            <Button type="submit" loading={loading}>
              保存
            </Button>
            <Button variant="default" onClick={cancelEdit}>
              キャンセル
            </Button>
          </Group>
        </Stack>
      </form>
    );
  }

  return (
    <Stack p="md" gap="md">
      <Group justify="space-between">
        <Group gap="sm">
          <Title order={3}>{project.title}</Title>
          <Badge
            color={STATUS_COLORS[project.status as ProjectStatus]}
            variant="filled"
          >
            {STATUS_LABELS[project.status as ProjectStatus]}
          </Badge>
        </Group>
        <Group gap="xs">
          {project.gmailUrl && (
            <ActionIcon
              component="a"
              href={project.gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              color="gray"
              size="lg"
              title="Gmailを開く"
            >
              <IconExternalLink size={16} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="light"
            onClick={() => setEditing(true)}
            size="lg"
            title="編集"
          >
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="red"
            onClick={handleDelete}
            size="lg"
            title="削除"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* エージェント情報 */}
        {field("エージェント会社", project.agentCompany)}
        {field("担当者", project.agentPerson)}

        {/* 条件 */}
        {field("単価", project.price)}
        {field("稼働率", project.workRate)}
        {field("勤務地", project.location)}
        {field("リモート区分", project.remoteType)}
        {field("開始時期", project.startDateText)}
        {field("契約期間", project.contractPeriod)}

        {/* 次のアクション */}
        {field("次のアクション", project.nextAction)}
        {field("リマインド日", project.reminderDate)}
        {field("最終連絡日", project.lastContactAt)}
      </SimpleGrid>

      {project.techStack && project.techStack.length > 0 && (
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            技術スタック
          </Text>
          <Group gap="xs">
            {project.techStack.map((t) => (
              <Badge key={t} variant="outline" size="sm">
                {t}
              </Badge>
            ))}
          </Group>
        </Stack>
      )}

      {/* メール本文・サマリー */}
      {field("サマリー", project.summary)}
      {project.sourceText && (
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            メール本文
          </Text>
          <Text
            size="sm"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {project.sourceText}
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
