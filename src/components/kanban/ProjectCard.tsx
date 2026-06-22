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
} from "@mantine/core";
import { IconExternalLink, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import type { Project } from "@/db/schema";
import { STATUS_LABELS, STATUS_COLORS, type ProjectStatus } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const status = project.status as ProjectStatus;

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="sm" lineClamp={2} flex={1}>
            {project.title}
          </Text>
          <Badge color={STATUS_COLORS[status]} size="xs" variant="light">
            {STATUS_LABELS[status]}
          </Badge>
        </Group>

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

        <Text size="xs" c="dimmed">
          更新：{new Date(project.updatedAt).toLocaleDateString("ja-JP")}
        </Text>

        <Group gap="xs" mt="xs">
          <Button
            component={Link}
            href={`/dashboard/projects/${project.id}`}
            size="xs"
            variant="light"
            rightSection={<IconChevronRight size={12} />}
            flex={1}
          >
            詳細
          </Button>
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
