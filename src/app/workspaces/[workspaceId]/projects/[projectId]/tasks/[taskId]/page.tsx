"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole, getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  assignTask,
  cancelTask,
  deleteTask,
  getTaskDetail,
  moveTaskToSprint,
  updateTaskStatus,
} from "@/features/tasks/api/tasks.api";
import { TaskStatusSelect } from "@/features/tasks/components/TaskStatusSelect";
import { Task, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Date(value).toLocaleString("vi-VN");
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    taskId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [myRole, setMyRole] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const canManage = writeRoles.includes(myRole) && project?.status === "ACTIVE";
  const currentAssigneeId = task?.assigneeId ?? task?.assignee?.id ?? null;
  const isCurrentAssignee = Boolean(
    task && user && currentAssigneeId === user.id,
  );
  const canChangeStatus =
    canManage || (myRole === "MEMBER" && isCurrentAssignee);
  const canDelete = Boolean(
    task && user && (writeRoles.includes(myRole) || task.createdBy === user.id),
  );
  const canHandover = Boolean(
    task &&
      user &&
      isCurrentAssignee &&
      ["IN_PROGRESS", "REVIEW"].includes(task.status),
  );

  const loadTask = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectResponse, taskResponse, membersResponse, sprintsResponse, roleResponse] =
          await Promise.all([
            getProjectDetail(params.workspaceId, params.projectId),
            getTaskDetail(params.workspaceId, params.projectId, params.taskId),
            getWorkspaceMembers(params.workspaceId),
            getSprints(params.workspaceId, params.projectId, {
              page: 1,
              limit: 100,
            }),
            getMyWorkspaceRole(params.workspaceId),
          ]);
        const loadedTask = taskResponse.data.task;

        setProject(projectResponse.data.project);
        setTask(loadedTask);
        setMembers(membersResponse.data.items);
        setSprints(
          sprintsResponse.data.items.filter(
            (sprint) =>
              sprint.status !== "COMPLETED" && sprint.status !== "CANCELLED",
          ),
        );
        setMyRole(roleResponse.data.role);
        setSelectedAssigneeId(loadedTask.assigneeId ?? "");
        setSelectedSprintId(loadedTask.sprintId ?? "");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Tải chi tiết task thất bại.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [params.projectId, params.taskId, params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.taskId) {
      void loadTask();
    }
  }, [user, params.workspaceId, params.projectId, params.taskId, loadTask]);

  async function handleStatusChange(status: TaskStatus, workflowStatusId?: string) {
    if (!task) return;
    setActionBusy(true);
    setMessage("");

    try {
      const response = await updateTaskStatus(
        params.workspaceId,
        params.projectId,
        task.id,
        workflowStatusId ? { workflowStatusId } : { status },
      );
      setTask(response.data.task);
      setMessage("Cập nhật trạng thái task thành công.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Cập nhật trạng thái task thất bại.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleAssign() {
    if (!task) return;
    setActionBusy(true);
    setMessage("");

    try {
      const response = await assignTask(
        params.workspaceId,
        params.projectId,
        task.id,
        {
          assigneeId: selectedAssigneeId || null,
        },
      );
      setTask(response.data.task);
      setMessage("Cập nhật assignee thành công.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cập nhật assignee thất bại.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleMoveSprint() {
    if (!task) return;
    setActionBusy(true);
    setMessage("");

    try {
      const response = await moveTaskToSprint(
        params.workspaceId,
        params.projectId,
        task.id,
        {
          sprintId: selectedSprintId || null,
        },
      );
      setTask(response.data.task);
      setMessage("Di chuyển task thành công.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Di chuyển task thất bại.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCancel() {
    if (!task) return;
    if (!confirm("Xác nhận hủy task này?")) return;
    setActionBusy(true);
    setMessage("");

    try {
      const response = await cancelTask(
        params.workspaceId,
        params.projectId,
        task.id,
      );
      setTask(response.data.task);
      setMessage("Task đã được hủy.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Hủy task thất bại.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete() {
    if (!task || !canDelete) return;
    if (!confirm("Xóa công việc này? Công việc sẽ biến mất khỏi Backlog và Sprint.")) {
      return;
    }

    setActionBusy(true);
    setMessage("");

    try {
      await deleteTask(params.workspaceId, params.projectId, task.id);
      router.replace(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Xóa công việc thất bại.",
      );
      setActionBusy(false);
    }
  }

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
                Task detail
              </p>
              <h1 className="mt-1 text-xl font-bold text-zinc-900">
                {task?.taskCode ?? "Task"} · {task?.title ?? "Chi tiết task"}
              </h1>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {project?.name ?? "Dự án"} {myRole ? `· Vai trò: ${myRole}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canHandover ? (
                <Link
                  className="flex h-9 items-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/shift-handovers?taskId=${task?.id}`}
                >
                  Tạo bản bàn giao
                </Link>
              ) : null}
              <Link
                className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks`}
              >
                Danh sách task
              </Link>
              <button
                className="h-9 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                disabled={isLoading || actionBusy}
                type="button"
                onClick={() => void loadTask()}
              >
                Làm mới
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
        ) : task ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-zinc-400">
                    {task.taskCode}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-zinc-950">
                    {task.title}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-100 pt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Mô tả
                </h3>
                <p className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 text-sm leading-7 text-zinc-700">
                  {task.description || "Task này chưa có mô tả chi tiết."}
                </p>
              </div>

              <dl className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Assignee
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-zinc-800">
                    {task.assignee?.fullName ?? "Chưa gán"}
                  </dd>
                  {task.assignee?.email ? (
                    <dd className="mt-1 break-all text-[11px] text-zinc-500">
                      {task.assignee.email}
                    </dd>
                  ) : null}
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Sprint
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-zinc-800">
                    {task.sprint?.name ?? "Backlog"}
                  </dd>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Due date
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-zinc-800">
                    {formatDate(task.dueDate)}
                  </dd>
                </div>
              </dl>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900">
                  Bàn giao công việc
                </h3>
                {canHandover ? (
                  <>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      Chuyển task cùng toàn bộ bối cảnh cho một thành viên khác xác nhận tiếp nhận.
                    </p>
                    <Link
                      className="mt-4 flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700"
                      href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/shift-handovers?taskId=${task.id}`}
                    >
                      Tạo bản bàn giao
                    </Link>
                  </>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    {!isCurrentAssignee
                      ? `Chỉ người đang phụ trách task (${task.assignee?.email ?? "chưa xác định"}) mới có thể bàn giao.`
                      : "Task phải ở trạng thái Đang làm hoặc Review mới có thể bàn giao."}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900">
                  Cập nhật trạng thái
                </h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  MEMBER chỉ được đổi status nếu task được gán cho mình.
                </p>
                <div className="mt-4 grid gap-2">
                  <TaskStatusSelect
                    disabled={!canChangeStatus || actionBusy || task.status === "CANCELLED"}
                    value={task.status}
                    options={project?.workflowStatuses.map((status) => ({ id: status.workflowStatusId, key: status.key, label: status.label, enabled: status.enabled }))}
                    onChange={(status, workflowStatusId) => void handleStatusChange(status, workflowStatusId)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900">
                  Quản lý task
                </h3>
                <div className="mt-4 grid gap-3">
                  <select
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none transition focus:border-zinc-900 disabled:bg-zinc-100"
                    disabled={!canManage || actionBusy}
                    value={selectedAssigneeId}
                    onChange={(event) => setSelectedAssigneeId(event.target.value)}
                  >
                    <option value="">Chưa gán</option>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.fullName || "Chưa đặt tên"} ({member.email || member.userId})
                      </option>
                    ))}
                  </select>
                  <button
                    className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    disabled={!canManage || actionBusy}
                    type="button"
                    onClick={() => void handleAssign()}
                  >
                    Lưu assignee
                  </button>

                  <select
                    className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none transition focus:border-zinc-900 disabled:bg-zinc-100"
                    disabled={!canManage || actionBusy}
                    value={selectedSprintId}
                    onChange={(event) => setSelectedSprintId(event.target.value)}
                  >
                    <option value="">Backlog</option>
                    {sprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    disabled={!canManage || actionBusy}
                    type="button"
                    onClick={() => void handleMoveSprint()}
                  >
                    Lưu sprint
                  </button>

                  <button
                    className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                    disabled={!canManage || actionBusy || task.status === "CANCELLED"}
                    type="button"
                    onClick={() => void handleCancel()}
                  >
                    Hủy công việc
                  </button>

                  {canDelete ? (
                    <button
                      className="h-10 rounded-xl bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                      disabled={actionBusy}
                      type="button"
                      onClick={() => void handleDelete()}
                    >
                      Xóa công việc
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900">Thông tin</h3>
                <dl className="mt-4 space-y-3 text-xs">
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-zinc-400">
                      Creator
                    </dt>
                    <dd className="mt-1 font-semibold text-zinc-700">
                      {task.creator?.fullName ?? task.createdBy}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-zinc-400">
                      Created at
                    </dt>
                    <dd className="mt-1 font-semibold text-zinc-700">
                      {formatDateTime(task.createdAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center shadow-sm">
            <p className="text-sm font-semibold text-zinc-600">
              Không tìm thấy task.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
