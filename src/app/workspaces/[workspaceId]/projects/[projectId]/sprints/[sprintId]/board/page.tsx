"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprintDetail } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { getSprintTasks } from "@/features/tasks/api/tasks.api";
import { TaskBoard } from "@/features/tasks/components/TaskBoard";
import { Task } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

export default function SprintBoardPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    sprintId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [items, setItems] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadBoard = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectResponse, sprintResponse, tasksResponse] =
          await Promise.all([
            getProjectDetail(params.workspaceId, params.projectId),
            getSprintDetail(
              params.workspaceId,
              params.projectId,
              params.sprintId,
            ),
            getSprintTasks(params.workspaceId, params.projectId, params.sprintId),
          ]);
        setProject(projectResponse.data.project);
        setSprint(sprintResponse.data.sprint);
        setItems(tasksResponse.data.items);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Tải sprint board thất bại.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [params.projectId, params.sprintId, params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.sprintId) {
      void loadBoard();
    }
  }, [
    user,
    params.workspaceId,
    params.projectId,
    params.sprintId,
    loadBoard,
  ]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Sprint board
              </p>
              <h1 className="mt-1 text-xl font-bold text-zinc-900">
                {sprint?.name ?? "Board"}
              </h1>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {items.length} task trong sprint này
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/${params.sprintId}`}
              >
                Chi tiết sprint
              </Link>
              <button
                className="h-9 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                disabled={isLoading}
                type="button"
                onClick={() => void loadBoard()}
              >
                {isLoading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
          </div>
        </div>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : (
          <TaskBoard items={items} />
        )}
      </div>
    </AppShell>
  );
}
