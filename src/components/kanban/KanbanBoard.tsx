"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Group, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { KanbanColumn } from "./KanbanColumn";
import { ProjectCard } from "./ProjectCard";
import { PROJECT_STATUSES, STATUS_LABELS, type ProjectStatus } from "@/types/project";
import type { Project } from "@/db/schema";
import { updateProjectStatus } from "@/app/dashboard/actions";

interface KanbanBoardProps {
  projects: Project[];
}

export function KanbanBoard({ projects: initialProjects }: KanbanBoardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function onDragStart({ active }: DragStartEvent) {
    const project = projects.find((p) => p.id === active.id);
    setActiveProject(project ?? null);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveProject(null);

    if (!over) return;

    const projectId = String(active.id);
    const newStatus = String(over.id) as ProjectStatus;
    const project = projects.find((p) => p.id === projectId);

    if (!project || project.status === newStatus) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, status: newStatus } : p
      )
    );

    const result = await updateProjectStatus(projectId, newStatus);
    if (!result.success) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: project.status } : p
        )
      );
      notifications.show({
        title: "エラー",
        message: "ステータスの更新に失敗しました",
        color: "red",
      });
    }
  }

  const projectsByStatus = PROJECT_STATUSES.reduce(
    (acc, status) => ({
      ...acc,
      [status]: projects.filter((p) => p.status === status),
    }),
    {} as Record<ProjectStatus, Project[]>
  );

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <ScrollArea type="scroll" scrollbarSize={6}>
        <Group
          gap="md"
          align="flex-start"
          wrap="nowrap"
          pb="md"
        >
          {PROJECT_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              projects={projectsByStatus[status]}
            />
          ))}
        </Group>
      </ScrollArea>

      <DragOverlay>
        {activeProject && <ProjectCard project={activeProject} />}
      </DragOverlay>
    </DndContext>
  );
}
