"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { TaskStatusSelect } from "./TaskStatusSelect";
import { Task, TaskStatus } from "../types/task.type";

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
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
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
      return "Can lam";
    case "IN_PROGRESS":
      return "Dang lam";
    case "REVIEW":
      return "Review";
    case "DONE":
      return "Hoan thanh";
    case "CANCELLED":
      return "Da huy";
  }
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
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setAssigneeId(task?.assigneeId ?? "");
    setSprintId(task?.sprintId ?? "");
    setMessage("");
  }, [task?.id, task?.assigneeId, task?.sprintId]);

  if (!task) return null;

  const activeSprints = sprints.filter(
    (sprint) => sprint.status !== "COMPLETED" && sprint.status !== "CANCELLED",
  );

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setIsBusy(true);
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Thao tac that bai.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <button
        aria-label="Dong chi tiet task"
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
                Mo ta
              </h3>
              <p className="mt-2 rounded border border-[#dfe1e6] bg-[#f7f8f9] px-3 py-3 text-sm leading-6 text-[#172b4d]">
                {task.description || "Task nay chua co mo ta chi tiet."}
              </p>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-[#dfe1e6] bg-white px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#6b778c]">
                Nguoi nhan
              </p>
              <p className="mt-1 text-sm font-semibold text-[#172b4d]">
                {task.assignee?.fullName ?? "Chua gan"}
              </p>
              <p className="text-xs text-[#6b778c]">{task.assignee?.email ?? "-"}</p>
            </div>

            <div className="rounded border border-[#dfe1e6] bg-white px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#6b778c]">
                Han xu ly
              </p>
              <p className="mt-1 text-sm font-semibold text-[#172b4d]">
                {formatDate(task.dueDate)}
              </p>
              <p className="text-xs text-[#6b778c]">
                {task.estimatedHours ?? "-"}h / {task.storyPoints ?? "-"} SP
              </p>
            </div>
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#172b4d]">Cap nhat nhanh</h3>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Trang thai
                <TaskStatusSelect
                  disabled={!canChangeStatus || isBusy || task.status === "CANCELLED"}
                  onChange={(status) =>
                    void runAction(
                      () => onStatusChange(task, status),
                      "Da cap nhat trang thai task.",
                    )
                  }
                  value={task.status}
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Assignee
                <select
                  className="h-10 rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4] disabled:bg-[#f1f2f4]"
                  disabled={!canManage || isBusy}
                  onChange={(event) => setAssigneeId(event.target.value)}
                  value={assigneeId}
                >
                  <option value="">Chua gan</option>
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
                    "Da cap nhat nguoi nhan task.",
                  )
                }
                type="button"
              >
                Luu assignee
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
                    "Da di chuyen task.",
                  )
                }
                type="button"
              >
                Luu sprint
              </button>
            </div>
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#172b4d]">Thong tin</h3>
            <dl className="mt-3 grid gap-3 text-xs text-[#44546f]">
              <div>
                <dt className="font-bold uppercase tracking-wide text-[#6b778c]">
                  Nguoi tao
                </dt>
                <dd className="mt-1 font-semibold">
                  {task.creator?.fullName ?? task.createdBy}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-[#6b778c]">
                  Ngay tao
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
            Mo trang chi tiet
          </Link>
          <button
            className="rounded border border-[#ffbdad] bg-[#fff4f2] px-3 py-2 text-sm font-semibold text-[#ae2a19] hover:bg-[#ffebe6] disabled:cursor-not-allowed disabled:border-[#dfe1e6] disabled:bg-[#f1f2f4] disabled:text-[#6b778c]"
            disabled={!canManage || isBusy || task.status === "CANCELLED"}
            onClick={() => {
              if (!confirm("Huy task nay?")) return;
              void runAction(() => onCancel(task), "Da huy task.");
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
    </div>
  );
}
