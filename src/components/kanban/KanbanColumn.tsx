"use client";

import { Stack, Text, Badge, Group, Box, ScrollArea } from "@mantine/core";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableProjectCard } from "./SortableProjectCard";
import type { Project } from "@/db/schema";
import { STATUS_COLORS, type ProjectStatus } from "@/types/project";

interface KanbanColumnProps {
  status: ProjectStatus;
  label: string;
  projects: Project[];
}

export function KanbanColumn({ status, label, projects }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Box
      ref={setNodeRef}
      style={{
        minWidth: 240,
        maxWidth: 280,
        flex: "0 0 260px",
        background: isOver ? "var(--mantine-color-blue-0)" : "var(--mantine-color-gray-0)",
        borderRadius: "var(--mantine-radius-md)",
        transition: "background 0.15s",
      }}
      p="sm"
    >
      <Group mb="sm" justify="space-between">
        <Text fw={600} size="sm">
          {label}
        </Text>
        <Badge
          color={STATUS_COLORS[status]}
          size="sm"
          variant="filled"
          circle
        >
          {projects.length}
        </Badge>
      </Group>

      <ScrollArea.Autosize mah="calc(100vh - 200px)">
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack gap="sm">
            {projects.map((project) => (
              <SortableProjectCard key={project.id} project={project} />
            ))}
          </Stack>
        </SortableContext>
      </ScrollArea.Autosize>
    </Box>
  );
}
