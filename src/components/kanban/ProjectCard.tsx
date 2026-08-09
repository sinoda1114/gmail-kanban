"use client";

import {
  Card,
  Text,
  Badge,
  Group,
  Button,
  Stack,
  ActionIcon,
  Tooltip,
  Select,
} from "@mantine/core";
import {
  IconExternalLink,
  IconChevronRight,
  IconCalendar,
} from "@tabler/icons-react";
import Link from "next/link";
import type { Project } from "@/db/schema";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  isProjectStatus,
  type ProjectStatus,
} from "@/types/project";
import {
  formatElapsedDays,
  getOwnershipHint,
  isActionableCard,
  formatInterviewDatetime,
} from "@/lib/kanban";

interface ProjectCardProps {
  project: Project;
  interviewAt?: string | null;
  onStatusChange?: (projectId: string, newStatus: ProjectStatus) => void;
  onInteractivePointerDown?: (event: React.PointerEvent) => void;
}

const STATUS_OPTIONS = PROJECT_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

export function ProjectCard({
  project,
  interviewAt,
  onStatusChange,
  onInteractivePointerDown,
}: ProjectCardProps) {
  const status = isProjectStatus(project.status) ? project.status : "reply_required";
  const ownership = getOwnershipHint(status);
  const actionable = isActionableCard(project);
  const showInterview = status === "interview_scheduled" && interviewAt;

  const borderColor = actionable
    ? status === "reply_required"
      ? "var(--mantine-color-red-4)"
      : "var(--mantine-color-orange-4)"
    : undefined;

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{
        borderColor,
        borderWidth: actionable ? 2 : undefined,
        background: actionable ? "var(--mantine-color-gray-0)" : undefined,
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text fw={600} size="sm" lineClamp={2} flex={1}>
            {project.title}
          </Text>
          {ownership && (
            <Badge color={ownership.color} size="xs" variant="dot">
              {ownership.label}
            </Badge>
          )}
        </Group>

        {onStatusChange ? (
          <Select
            size="xs"
            data={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              if (value && isProjectStatus(value) && value !== status) {
                onStatusChange(project.id, value);
              }
            }}
            onPointerDown={onInteractivePointerDown}
            comboboxProps={{ withinPortal: true }}
            aria-label="ステータス変更"
          />
        ) : (
          <Badge color={STATUS_COLORS[status]} size="xs" variant="light" w="fit-content">
            {STATUS_LABELS[status]}
          </Badge>
        )}

        {project.agentCompany && (
          <Text size="xs" c="dimmed">
            {project.agentCompany}
            {project.agentPerson ? ` / ${project.agentPerson}` : ""}
          </Text>
        )}

        {project.nextAction && (
          <Text size="xs" c="blue.7" lineClamp={2}>
            次：{project.nextAction}
          </Text>
        )}

        {showInterview && (
          <Group gap={4} wrap="nowrap">
            <IconCalendar size={12} color="var(--mantine-color-violet-6)" />
            <Text size="xs" c="violet.7">
              {formatInterviewDatetime(interviewAt)}
            </Text>
          </Group>
        )}

        <Text size="xs" c="dimmed">
          {formatElapsedDays(project)}
        </Text>

        <Group gap="xs" mt="xs">
          <Button
            component={Link}
            href={`/dashboard/projects/${project.id}`}
            size="xs"
            variant="light"
            rightSection={<IconChevronRight size={12} />}
            flex={1}
            onPointerDown={onInteractivePointerDown}
          >
            詳細
          </Button>
          {showInterview && (
            <Button
              component={Link}
              href={`/dashboard/projects/${project.id}?tab=interview_prep`}
              size="xs"
              variant="light"
              color="violet"
              onPointerDown={onInteractivePointerDown}
            >
              面談準備
            </Button>
          )}
          {project.gmailUrl && (
            <Tooltip label="Gmailを開く">
              <ActionIcon
                component="a"
                href={project.gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                color="gray"
                size="md"
                onPointerDown={onInteractivePointerDown}
              >
                <IconExternalLink size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
