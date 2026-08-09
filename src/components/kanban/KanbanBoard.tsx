"use client";

import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Group,
  ScrollArea,
  TextInput,
  MultiSelect,
  Button,
  Switch,
  Text,
  Stack,
} from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { KanbanColumn, type KanbanColumnProject } from "./KanbanColumn";
import { ProjectCard } from "./ProjectCard";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  isProjectStatus,
  type ProjectStatus,
} from "@/types/project";
import { updateProjectStatus } from "@/app/dashboard/actions";
import { matchesKanbanFilter, COLLAPSED_STATUSES } from "@/lib/kanban";

export type KanbanProject = KanbanColumnProject;

interface KanbanBoardProps {
  projects: KanbanProject[];
}

const STATUS_FILTER_OPTIONS = PROJECT_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

export function KanbanBoard({ projects: initialProjects }: KanbanBoardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState<KanbanProject | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilters, setStatusFilters] = useState<ProjectStatus[]>([]);
  const [showCollapsed, setShowCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredProjects = useMemo(
    () => projects.filter((p) => matchesKanbanFilter(p, searchText, statusFilters)),
    [projects, searchText, statusFilters]
  );

  const effectiveShowCollapsed =
    showCollapsed || statusFilters.some((s) => COLLAPSED_STATUSES.includes(s));

  const visibleStatuses = useMemo(() => {
    if (effectiveShowCollapsed) return PROJECT_STATUSES;
    return PROJECT_STATUSES.filter((s) => !COLLAPSED_STATUSES.includes(s));
  }, [effectiveShowCollapsed]);

  const hiddenCount = useMemo(() => {
    if (effectiveShowCollapsed) return 0;
    return filteredProjects.filter(
      (p) => isProjectStatus(p.status) && COLLAPSED_STATUSES.includes(p.status)
    ).length;
  }, [filteredProjects, effectiveShowCollapsed]);

  const changeStatus = useCallback(
    async (projectId: string, newStatus: ProjectStatus) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || project.status === newStatus) return;
      const oldStatus = project.status;
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      const result = await updateProjectStatus(projectId, newStatus);
      if (!result.success) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status: oldStatus } : p))
        );
        notifications.show({
          title: "エラー",
          message: "ステータスの更新に失敗しました",
          color: "red",
        });
      }
    },
    [projects]
  );

  function onDragStart({ active }: DragStartEvent) {
    setActiveProject(projects.find((p) => p.id === active.id) ?? null);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveProject(null);
    if (!over) return;
    const newStatus = String(over.id);
    if (!isProjectStatus(newStatus)) return;
    await changeStatus(String(active.id), newStatus);
  }

  const projectsByStatus = useMemo(
    () =>
      PROJECT_STATUSES.reduce(
        (acc, status) => ({
          ...acc,
          [status]: filteredProjects.filter((p) => p.status === status),
        }),
        {} as Record<ProjectStatus, KanbanProject[]>
      ),
    [filteredProjects]
  );

  const hasActiveFilters = searchText.trim().length > 0 || statusFilters.length > 0;

  return (
    <Stack gap="md">
      <Group align="flex-end" wrap="wrap">
        <TextInput
          placeholder="タイトル・エージェント・技術・次アクションで検索"
          leftSection={<IconSearch size={16} />}
          value={searchText}
          onChange={(e) => setSearchText(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <MultiSelect
          placeholder="ステータスで絞り込み"
          data={STATUS_FILTER_OPTIONS}
          value={statusFilters}
          onChange={(values) => setStatusFilters(values.filter(isProjectStatus))}
          clearable
          style={{ minWidth: 200 }}
        />
        {hasActiveFilters && (
          <Button
            variant="subtle"
            leftSection={<IconX size={14} />}
            onClick={() => {
              setSearchText("");
              setStatusFilters([]);
            }}
          >
            クリア
          </Button>
        )}
        <Switch
          label="終了・保留を表示"
          checked={showCollapsed}
          onChange={(e) => setShowCollapsed(e.currentTarget.checked)}
        />
      </Group>

      {!effectiveShowCollapsed && hiddenCount > 0 && (
        <Text size="xs" c="dimmed">
          終了・保留の案件 {hiddenCount} 件は非表示です。「終了・保留を表示」で表示できます。
        </Text>
      )}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <ScrollArea type="scroll" scrollbarSize={6}>
          <Group gap="md" align="flex-start" wrap="nowrap" pb="md">
            {visibleStatuses.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                label={STATUS_LABELS[status]}
                projects={projectsByStatus[status]}
                onStatusChange={changeStatus}
              />
            ))}
          </Group>
        </ScrollArea>
        <DragOverlay>
          {activeProject && (
            <ProjectCard project={activeProject} interviewAt={activeProject.interviewAt} />
          )}
        </DragOverlay>
      </DndContext>
    </Stack>
  );
}
