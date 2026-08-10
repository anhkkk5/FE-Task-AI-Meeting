"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, Inbox } from "lucide-react";
import { MyWorkTask } from "../types/my-work.type";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  formatDueDate,
  isOverdue,
} from "../utils/my-work.util";

type MyWorkTaskListProps = {
  tasks: MyWorkTask[];
  isLoading: boolean;
};

/**
 * Danh sach task cua toi. Moi dong link truc tiep den URL task long nhau
 * (workspace -> project -> task) nen khong con phu thuoc workspace "mac dinh".
 */
export function MyWorkTaskList({ tasks, isLoading }: MyWorkTaskListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-14 text-sm font-semibold text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Đang tổng hợp công việc...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Inbox className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            Không có task nào khớp bộ lọc
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Thử đổi bộ lọc, hoặc mở một dự án để xem toàn bộ board.
          </p>
        </div>
        <Link
          href="/workspaces"
          id="my-work-empty-pick-project"
          className="mt-1 flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
        >
          <FolderKanban className="h-3.5 w-3.5" />
          Chọn dự án
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => {
        const overdue = isOverdue(task);

        return (
          <li key={task.id}>
            <Link
              href={`/workspaces/${task.workspaceId}/projects/${task.projectId}/tasks/${task.id}`}
              className="group flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                    {task.taskCode}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${STATUS_STYLE[task.status]}`}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>
                  {overdue ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">
                      Quá hạn
                    </span>
                  ) : null}
                  {task.isBlocked ? <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">Đang bị chặn</span> : null}
                  {task.isBlocking ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Đang chặn</span> : null}
                </div>
                <p className="mt-1.5 truncate text-sm font-bold text-slate-900">
                  {task.title}
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                  {task.workspaceName} / {task.projectName}
                  {task.sprint ? ` · ${task.sprint.name}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-4 sm:shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Hạn chót
                  </p>
                  <p
                    className={`text-xs font-bold ${overdue ? "text-rose-600" : "text-slate-700"}`}
                  >
                    {formatDueDate(task.dueDate)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
