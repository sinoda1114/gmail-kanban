"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, ActionIcon, Group } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/db/schema";
import type { ProjectStatus } from "@/types/project";

interface SortableProjectCardProps {
  project: Project;
  interviewAt?: string | null;
  onStatusChange?: (projectId: string, newStatus: ProjectStatus) => void;
}

function stopDragPropagation(event: React.PointerEvent) {
  event.stopPropagation();
}

export function SortableProjectCard({
  project,
  interviewAt,
  onStatusChange,
}: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
    >
      <Group gap={4} wrap="nowrap" align="flex-start">
        <ActionIcon
          {...listeners}
          variant="subtle"
          color="gray"
          size="sm"
          style={{ cursor: "grab", marginTop: 4, flexShrink: 0 }}
          aria-label="ドラッグして移動"
        >
          <IconGripVertical size={14} />
        </ActionIcon>
        <Box flex={1} style={{ minWidth: 0 }}>
          <ProjectCard
            project={project}
            interviewAt={interviewAt}
            onStatusChange={onStatusChange}
            onInteractivePointerDown={stopDragPropagation}
          />
        </Box>
      </Group>
    </Box>
  );
}
