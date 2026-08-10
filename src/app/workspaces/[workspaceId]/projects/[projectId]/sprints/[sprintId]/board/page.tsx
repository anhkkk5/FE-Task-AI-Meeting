"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprintDetail } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { assignTask, getSprintTasks, moveTaskToSprint, updateTask, updateTaskStatus } from "@/features/tasks/api/tasks.api";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
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
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const loadBoard = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectResponse, sprintResponse, tasksResponse, membersResponse] =
          await Promise.all([
            getProjectDetail(params.workspaceId, params.projectId),
            getSprintDetail(
              params.workspaceId,
              params.projectId,
              params.sprintId,
            ),
            getSprintTasks(params.workspaceId, params.projectId, params.sprintId),
            getWorkspaceMembers(params.workspaceId),
          ]);
        setProject(projectResponse.data.project);
        setSprint(sprintResponse.data.sprint);
        setItems(tasksResponse.data.items);
        setMembers(membersResponse.data.items);
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

  const toggleSelection = (taskId: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(taskId)) next.delete(taskId); else next.add(taskId); return next; });
  const runBulk = async (action: "status" | "assignee" | "priority" | "backlog", value: string) => {
    setIsBulkUpdating(true);
    const selected = items.filter((item) => selectedIds.has(item.id));
    const results = await Promise.allSettled(selected.map((task) => action === "status" ? updateTaskStatus(params.workspaceId, params.projectId, task.id, { status: value as Task["status"] }) : action === "assignee" ? assignTask(params.workspaceId, params.projectId, task.id, { assigneeId: value === "UNASSIGNED" ? null : value }) : action === "priority" ? updateTask(params.workspaceId, params.projectId, task.id, { priority: value as Task["priority"] }) : moveTaskToSprint(params.workspaceId, params.projectId, task.id, { sprintId: null })));
    const failed = results.filter((result) => result.status === "rejected").length;
    setSelectedIds(new Set());
    await loadBoard();
    setMessage(failed ? `Đã cập nhật ${results.length - failed}/${results.length} Task; ${failed} Task bị từ chối.` : `Đã cập nhật ${results.length} Task.`);
    setIsBulkUpdating(false);
  };

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

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <label className="flex items-center gap-2 text-xs font-bold text-blue-900"><input checked={items.length > 0 && items.every((item) => selectedIds.has(item.id))} onChange={(event) => setSelectedIds(event.target.checked ? new Set(items.map((item) => item.id)) : new Set())} type="checkbox" />Chọn tất cả</label><span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">{selectedIds.size} đã chọn</span>
          {selectedIds.size ? <><select className="h-9 rounded border border-blue-200 bg-white px-2 text-xs" defaultValue="" disabled={isBulkUpdating} onChange={(event) => { void runBulk("status", event.target.value); event.target.value = ""; }}><option value="" disabled>Trạng thái...</option><option value="TODO">Cần làm</option><option value="IN_PROGRESS">Đang làm</option><option value="REVIEW">Review</option><option value="DONE">Hoàn thành</option></select><select className="h-9 rounded border border-blue-200 bg-white px-2 text-xs" defaultValue="" disabled={isBulkUpdating} onChange={(event) => { void runBulk("assignee", event.target.value); event.target.value = ""; }}><option value="" disabled>Người phụ trách...</option><option value="UNASSIGNED">Bỏ gán</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.fullName || member.email}</option>)}</select><select className="h-9 rounded border border-blue-200 bg-white px-2 text-xs" defaultValue="" disabled={isBulkUpdating} onChange={(event) => { void runBulk("priority", event.target.value); event.target.value = ""; }}><option value="" disabled>Ưu tiên...</option><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select><button className="h-9 rounded border border-blue-300 bg-white px-3 text-xs font-semibold text-blue-800" disabled={isBulkUpdating} onClick={() => void runBulk("backlog", "BACKLOG")} type="button">Chuyển về Backlog</button></> : <span className="text-xs text-blue-700">Chọn các thẻ để thao tác hàng loạt.</span>}
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : (
          <TaskBoard items={items} onToggle={toggleSelection} selectedIds={selectedIds} workflowStatuses={project?.workflowStatuses} />
        )}
      </div>
    </AppShell>
  );
}
