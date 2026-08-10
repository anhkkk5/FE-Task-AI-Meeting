"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { TaskStatusSelect } from "./TaskStatusSelect";
import { createTaskComment, createTaskDependency, deleteTaskComment, deleteTaskDependency, getTaskActivities, getTaskComments, getTaskDependencies, getTasks } from "../api/tasks.api";
import { Task, TaskActivity, TaskActivityAction, TaskComment, TaskDependency, TaskDependencyType, TaskStatus } from "../types/task.type";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/client";

type TaskDetailDrawerProps = {
  task: Task | null;
  workspaceId: string;
  projectId: string;
  members: WorkspaceMember[];
  sprints: Sprint[];
  canManage: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
  onClose: () => void;
  onStatusChange: (task: Task, status: TaskStatus, override?: { overrideBlocked: boolean; overrideReason: string }) => Promise<void>;
  onAssign: (task: Task, assigneeId: string | null) => Promise<void>;
  onMoveSprint: (task: Task, sprintId: string | null) => Promise<void>;
  onCancel: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function statusLabel(status: TaskStatus) {
  switch (status) {
    case "BACKLOG":
      return "Backlog";
    case "TODO":
      return "Cần làm";
    case "IN_PROGRESS":
      return "Đang làm";
    case "REVIEW":
      return "Review";
    case "DONE":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
  }
}

const activityLabels: Record<TaskActivityAction, string> = {
  CREATED: "đã tạo công việc",
  UPDATED: "đã cập nhật thông tin",
  STATUS_CHANGED: "đã đổi trạng thái",
  ASSIGNED: "đã thay đổi người phụ trách",
  SPRINT_MOVED: "đã chuyển Sprint",
  CANCELLED: "đã hủy công việc",
  DELETED: "đã xóa công việc",
  COMMENTED: "đã thêm bình luận",
  COMMENT_UPDATED: "đã sửa bình luận",
  COMMENT_DELETED: "đã xóa bình luận",
};

function displayActivityValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Trống";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

const dependencyTypeLabels: Record<TaskDependencyType, string> = {
  BLOCKS: "Chặn",
  DEPENDS_ON: "Phụ thuộc vào",
  RELATES_TO: "Liên quan tới",
  DUPLICATES: "Trùng với",
};

function dependencyLabel(item: TaskDependency, currentTaskId: string) {
  if (item.sourceTaskId === currentTaskId) return dependencyTypeLabels[item.type];
  if (item.type === "BLOCKS") return "Bị chặn bởi";
  if (item.type === "DEPENDS_ON") return "Được yêu cầu bởi";
  return dependencyTypeLabels[item.type];
}

export function TaskDetailDrawer({
  task,
  workspaceId,
  projectId,
  members,
  sprints,
  canManage,
  canChangeStatus,
  canDelete,
  onClose,
  onStatusChange,
  onAssign,
  onMoveSprint,
  onCancel,
  onDelete,
}: TaskDetailDrawerProps) {
  const { user } = useAuth(true);
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [dependencyCandidates, setDependencyCandidates] = useState<Task[]>([]);
  const [dependencyTargetId, setDependencyTargetId] = useState("");
  const [dependencyType, setDependencyType] = useState<TaskDependencyType>("DEPENDS_ON");
  const [isSavingDependency, setIsSavingDependency] = useState(false);
  const [blockedOverride, setBlockedOverride] = useState<{ blockers: Array<{ id: string; taskCode: string; title: string; status: TaskStatus }>; reason: string } | null>(null);

  async function loadActivities(taskId: string) {
    setIsLoadingActivities(true);
    try {
      const response = await getTaskActivities(workspaceId, projectId, taskId);
      setActivities(response.data.items);
    } catch {
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  }

  async function loadComments(taskId: string) {
    try {
      const response = await getTaskComments(workspaceId, projectId, taskId);
      setComments(response.data.items);
    } catch {
      setComments([]);
    }
  }

  async function loadDependencies(taskId: string) {
    try {
      const [dependencyResponse, tasksResponse] = await Promise.all([
        getTaskDependencies(workspaceId, projectId, taskId),
        getTasks(workspaceId, projectId, { limit: 50 }),
      ]);
      setDependencies(dependencyResponse.data.items);
      setDependencyCandidates(tasksResponse.data.items.filter((item) => item.id !== taskId));
    } catch {
      setDependencies([]);
      setDependencyCandidates([]);
    }
  }

  useEffect(() => {
    setAssigneeId(task?.assigneeId ?? "");
    setSprintId(task?.sprintId ?? "");
    setMessage("");
  }, [task?.id, task?.assigneeId, task?.sprintId]);

  useEffect(() => {
    if (task?.id) {
      void loadActivities(task.id);
      void loadComments(task.id);
      void loadDependencies(task.id);
    }
  }, [task?.id, workspaceId, projectId]);

  if (!task) return null;

  const activeSprints = sprints.filter(
    (sprint) => sprint.status !== "COMPLETED" && sprint.status !== "CANCELLED",
  );

  async function submitComment() {
    const content = commentContent.trim();
    if (!content || !task) return;
    const taskId = task.id;
    setIsSavingComment(true);
    try {
      await createTaskComment(workspaceId, projectId, taskId, content);
      setCommentContent("");
      await Promise.all([loadComments(taskId), loadActivities(taskId)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu bình luận.");
    } finally {
      setIsSavingComment(false);
    }
  }

  async function removeComment(commentId: string) {
    if (!task) return;
    const taskId = task.id;
    setIsSavingComment(true);
    try {
      await deleteTaskComment(workspaceId, projectId, taskId, commentId);
      await Promise.all([loadComments(taskId), loadActivities(taskId)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa bình luận.");
    } finally {
      setIsSavingComment(false);
    }
  }

  async function addDependency() {
    if (!task || !dependencyTargetId) return;
    setIsSavingDependency(true);
    setMessage("");
    try {
      await createTaskDependency(workspaceId, projectId, task.id, dependencyTargetId, dependencyType);
      setDependencyTargetId("");
      await loadDependencies(task.id);
      setMessage("Đã thêm liên kết công việc.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thêm liên kết.");
    } finally {
      setIsSavingDependency(false);
    }
  }

  async function changeStatus(status: TaskStatus) {
    if (!task) return;
    setIsBusy(true);
    setMessage("");
    try {
      await onStatusChange(task, status);
      setMessage("Đã cập nhật trạng thái task.");
      await Promise.all([loadActivities(task.id), loadDependencies(task.id)]);
    } catch (error) {
      const details = error instanceof ApiError && error.details && typeof error.details === "object" ? error.details as { blockers?: Array<{ id: string; taskCode: string; title: string; status: TaskStatus }>; overrideRequired?: boolean } : null;
      if (status === "DONE" && canManage && details?.overrideRequired && details.blockers?.length) {
        setBlockedOverride({ blockers: details.blockers, reason: "" });
      } else {
        setMessage(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.");
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmBlockedOverride() {
    if (!task || !blockedOverride || blockedOverride.reason.trim().length < 5) return;
    setIsBusy(true);
    try {
      await onStatusChange(task, "DONE", { overrideBlocked: true, overrideReason: blockedOverride.reason.trim() });
      setBlockedOverride(null);
      setMessage("Đã hoàn thành Task với lý do override được lưu trong lịch sử.");
      await Promise.all([loadActivities(task.id), loadDependencies(task.id)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể override Task.");
    } finally {
      setIsBusy(false);
    }
  }

  async function removeDependency(dependencyId: string) {
    if (!task) return;
    setIsSavingDependency(true);
    try {
      await deleteTaskDependency(workspaceId, projectId, task.id, dependencyId);
      await loadDependencies(task.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa liên kết.");
    } finally {
      setIsSavingDependency(false);
    }
  }

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setIsBusy(true);
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
      if (task) await loadActivities(task.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <button
        aria-label="Đóng chi tiết task"
        className="hidden flex-1 cursor-default bg-transparent md:block"
        onClick={onClose}
        type="button"
      />

      <aside className="flex h-full w-full max-w-xl flex-col border-l border-[#dfe1e6] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#dfe1e6] px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-[#6b778c]">
              {task.taskCode}
            </p>
            <h2 className="mt-1 line-clamp-2 text-xl font-semibold text-[#172b4d]">
              {task.title}
            </h2>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#44546f] hover:bg-[#f1f2f4]"
            onClick={onClose}
            type="button"
          >
            X
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {message ? (
            <div className="rounded border border-[#f5cd47] bg-[#fff7d6] px-3 py-2 text-sm font-medium text-[#7f5f01]">
              {message}
            </div>
          ) : null}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-[#dfe1e6] bg-[#f1f2f4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#44546f]">
                {statusLabel(task.status)}
              </span>
              <span className="rounded border border-[#dfe1e6] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#44546f]">
                {task.sprint?.name ?? "Backlog"}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#6b778c]">
                Mô tả
              </h3>
              <p className="mt-2 rounded border border-[#dfe1e6] bg-[#f7f8f9] px-3 py-3 text-sm leading-6 text-[#172b4d]">
                {task.description || "Task này chưa có mô tả chi tiết."}
              </p>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-[#dfe1e6] bg-white px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#6b778c]">
                Người nhận
              </p>
              <p className="mt-1 text-sm font-semibold text-[#172b4d]">
                {task.assignee?.fullName ?? "Chưa gán"}
              </p>
              <p className="text-xs text-[#6b778c]">{task.assignee?.email ?? "-"}</p>
            </div>

            <div className="rounded border border-[#dfe1e6] bg-white px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#6b778c]">
                Hạn xử lý
              </p>
              <p className="mt-1 text-sm font-semibold text-[#172b4d]">
                {formatDate(task.dueDate)}
              </p>
            </div>
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#172b4d]">Cập nhật nhanh</h3>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Trạng thái
                <TaskStatusSelect
                  disabled={!canChangeStatus || isBusy || task.status === "CANCELLED"}
                  onChange={(status) => void changeStatus(status)}
                  value={task.status}
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Người phụ trách
                <select
                  className="h-10 rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4] disabled:bg-[#f1f2f4]"
                  disabled={!canManage || isBusy}
                  onChange={(event) => setAssigneeId(event.target.value)}
                  value={assigneeId}
                >
                  <option value="">Chưa gán</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName || member.email || member.userId}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="h-10 rounded bg-[#172b4d] px-4 text-sm font-semibold text-white hover:bg-[#0c1f3f] disabled:cursor-not-allowed disabled:bg-[#b3b9c4]"
                disabled={!canManage || isBusy}
                onClick={() =>
                  void runAction(
                    () => onAssign(task, assigneeId || null),
                    "Đã cập nhật người nhận task.",
                  )
                }
                type="button"
              >
                Lưu người phụ trách
              </button>

              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Sprint
                <select
                  className="h-10 rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4] disabled:bg-[#f1f2f4]"
                  disabled={!canManage || isBusy}
                  onChange={(event) => setSprintId(event.target.value)}
                  value={sprintId}
                >
                  <option value="">Backlog</option>
                  {activeSprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="h-10 rounded bg-[#172b4d] px-4 text-sm font-semibold text-white hover:bg-[#0c1f3f] disabled:cursor-not-allowed disabled:bg-[#b3b9c4]"
                disabled={!canManage || isBusy}
                onClick={() =>
                  void runAction(
                    () => onMoveSprint(task, sprintId || null),
                    "Đã di chuyển task.",
                  )
                }
                type="button"
              >
                Lưu sprint
              </button>
            </div>
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#172b4d]">Liên kết công việc</h3>
                <p className="mt-1 text-xs text-[#6b778c]">Theo dõi Task đang chặn, phụ thuộc hoặc liên quan.</p>
              </div>
              {dependencies.some((item) => {
                const blocker = item.type === "DEPENDS_ON" && item.sourceTaskId === task.id ? item.targetTask : item.type === "BLOCKS" && item.targetTaskId === task.id ? item.sourceTask : null;
                return blocker && blocker.status !== "DONE";
              }) ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase text-rose-700">Đang bị chặn</span> : null}
            </div>
            <div className="mt-3 space-y-2">
              {dependencies.length === 0 ? <p className="rounded bg-[#f7f8f9] px-3 py-3 text-xs text-[#6b778c]">Chưa có liên kết nào.</p> : dependencies.map((item) => {
                const relatedTask = item.sourceTaskId === task.id ? item.targetTask : item.sourceTask;
                return <div className="flex items-center justify-between gap-3 rounded border border-[#dfe1e6] px-3 py-2" key={item.id}>
                  <Link className="min-w-0 hover:text-[#0c66e4]" href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${relatedTask.id}`}>
                    <p className="text-[10px] font-bold uppercase text-[#6b778c]">{dependencyLabel(item, task.id)}</p>
                    <p className="truncate text-sm font-semibold text-[#172b4d]">{relatedTask.taskCode} · {relatedTask.title}</p>
                    <p className="text-[10px] text-[#6b778c]">{statusLabel(relatedTask.status)}</p>
                  </Link>
                  {canManage ? <button className="shrink-0 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50" disabled={isSavingDependency} onClick={() => void removeDependency(item.id)} type="button">Xóa</button> : null}
                </div>;
              })}
            </div>
            {canManage ? <div className="mt-4 grid gap-2 border-t border-[#dfe1e6] pt-4 sm:grid-cols-[140px_1fr_auto]">
              <select className="h-9 rounded border border-[#dfe1e6] bg-white px-2 text-xs" disabled={isSavingDependency} onChange={(event) => setDependencyType(event.target.value as TaskDependencyType)} value={dependencyType}>
                {Object.entries(dependencyTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select className="h-9 min-w-0 rounded border border-[#dfe1e6] bg-white px-2 text-xs" disabled={isSavingDependency} onChange={(event) => setDependencyTargetId(event.target.value)} value={dependencyTargetId}>
                <option value="">Chọn công việc...</option>
                {dependencyCandidates.map((item) => <option key={item.id} value={item.id}>{item.taskCode} · {item.title}</option>)}
              </select>
              <button className="h-9 rounded bg-[#0c66e4] px-3 text-xs font-semibold text-white disabled:bg-slate-300" disabled={isSavingDependency || !dependencyTargetId} onClick={() => void addDependency()} type="button">Thêm</button>
            </div> : null}
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#172b4d]">Bình luận</h3>
            <div className="mt-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-[#6b778c]">Chưa có bình luận.</p>
              ) : comments.map((comment) => (
                <article key={comment.id} className="rounded-lg border border-[#dfe1e6] bg-[#f7f8f9] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#172b4d]">{comment.author.fullName || comment.author.email}</p>
                      <p className="text-[10px] text-[#6b778c]">{formatDateTime(comment.createdAt)}</p>
                    </div>
                    {comment.author.id === user?.id ? (
                      <button className="text-[11px] font-semibold text-rose-600 hover:underline" disabled={isSavingComment} onClick={() => void removeComment(comment.id)} type="button">Xóa</button>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#172b4d]">{comment.content}</p>
                </article>
              ))}
            </div>
            <textarea
              className="mt-4 min-h-24 w-full resize-y rounded-lg border border-[#dfe1e6] px-3 py-2 text-sm text-[#172b4d] outline-none focus:border-brand-500"
              maxLength={5000}
              placeholder="Viết bình luận… Dùng @email để nhắc thành viên"
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[10px] text-[#6b778c]">Ví dụ: @member@example.com vui lòng kiểm tra.</p>
              <button className="shrink-0 rounded bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300" disabled={isSavingComment || !commentContent.trim()} onClick={() => void submitComment()} type="button">{isSavingComment ? "Đang gửi..." : "Gửi"}</button>
            </div>
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#172b4d]">Lịch sử hoạt động</h3>
            {isLoadingActivities ? (
              <p className="mt-3 text-xs text-[#6b778c]">Đang tải lịch sử...</p>
            ) : activities.length === 0 ? (
              <p className="mt-3 text-xs text-[#6b778c]">Chưa có hoạt động được ghi nhận.</p>
            ) : (
              <ol className="mt-3 space-y-4 border-l-2 border-[#dfe1e6] pl-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600" />
                    <p className="text-xs text-[#172b4d]">
                      <strong>{activity.actor.fullName || activity.actor.email}</strong>{" "}
                      {activityLabels[activity.action]}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6b778c]">
                      {formatDateTime(activity.createdAt)}
                    </p>
                    {activity.changes ? (
                      <div className="mt-2 space-y-1 rounded bg-[#f7f8f9] px-3 py-2 text-[11px] text-[#44546f]">
                        {Object.entries(activity.changes).map(([field, change]) => (
                          <p key={field}>
                            <strong>{field}</strong>: {displayActivityValue(change.from)} → {displayActivityValue(change.to)}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#172b4d]">Thông tin</h3>
            <dl className="mt-3 grid gap-3 text-xs text-[#44546f]">
              <div>
                <dt className="font-bold uppercase tracking-wide text-[#6b778c]">
                  Người tạo
                </dt>
                <dd className="mt-1 font-semibold">
                  {task.creator?.fullName ?? task.createdBy}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-[#6b778c]">
                  Ngày tạo
                </dt>
                <dd className="mt-1 font-semibold">{formatDateTime(task.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dfe1e6] px-5 py-4">
          <Link
            className="rounded border border-[#dfe1e6] bg-white px-3 py-2 text-sm font-semibold text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`}
          >
            Mở trang chi tiết
          </Link>
          <button
            className="rounded border border-[#ffbdad] bg-[#fff4f2] px-3 py-2 text-sm font-semibold text-[#ae2a19] hover:bg-[#ffebe6] disabled:cursor-not-allowed disabled:border-[#dfe1e6] disabled:bg-[#f1f2f4] disabled:text-[#6b778c]"
            disabled={!canManage || isBusy || task.status === "CANCELLED"}
            onClick={() => {
              if (!confirm("Hủy task này?")) return;
              void runAction(() => onCancel(task), "Đã hủy task.");
            }}
            type="button"
          >
            Hủy công việc
          </button>
          {canDelete ? (
            <button
              className="rounded bg-[#c9372c] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ae2a19] disabled:cursor-not-allowed disabled:bg-[#b3b9c4]"
              disabled={isBusy}
              onClick={() => {
                if (!confirm("Xóa công việc này khỏi Backlog và Sprint?")) return;
                void runAction(() => onDelete(task), "Đã xóa công việc.");
              }}
              type="button"
            >
              Xóa công việc
            </button>
          ) : null}
        </footer>
      </aside>
      {blockedOverride ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-[#172b4d]">Task vẫn đang bị chặn</h3>
            <p className="mt-1 text-sm text-[#6b778c]">Các công việc sau chưa hoàn thành:</p>
            <ul className="mt-3 space-y-2">
              {blockedOverride.blockers.map((blocker) => <li className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm" key={blocker.id}><strong>{blocker.taskCode}</strong> · {blocker.title} <span className="text-xs text-rose-700">({statusLabel(blocker.status)})</span></li>)}
            </ul>
            <label className="mt-4 block text-sm font-semibold text-[#172b4d]">Lý do override <span className="text-rose-600">*</span>
              <textarea className="mt-2 min-h-24 w-full rounded border border-[#dfe1e6] px-3 py-2 text-sm font-normal outline-none focus:border-[#0c66e4]" maxLength={500} onChange={(event) => setBlockedOverride((current) => current ? { ...current, reason: event.target.value } : null)} placeholder="Giải thích vì sao vẫn có thể hoàn thành Task..." value={blockedOverride.reason} />
            </label>
            <p className="mt-1 text-xs text-[#6b778c]">Tối thiểu 5 ký tự. Lý do sẽ được lưu vào lịch sử hoạt động.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded px-4 py-2 text-sm font-semibold text-[#44546f] hover:bg-[#f1f2f4]" disabled={isBusy} onClick={() => setBlockedOverride(null)} type="button">Hủy</button>
              <button className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-slate-300" disabled={isBusy || blockedOverride.reason.trim().length < 5} onClick={() => void confirmBlockedOverride()} type="button">Xác nhận hoàn thành</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
