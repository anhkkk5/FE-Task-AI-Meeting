"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { MyWorkTask } from "@/features/my-work/types/my-work.type";
import { describeDueDate, formatRelativeTime } from "@/lib/utils/relative-time";

type DashboardRecentActivityProps = {
  tasks: MyWorkTask[];
  isLoading: boolean;
};

export function DashboardRecentActivity({
  tasks,
  isLoading,
}: DashboardRecentActivityProps) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs text-xs text-slate-500 font-semibold">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#367ea2] border-t-transparent mr-2" />
        Đang tải hoạt động gần đây...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-[#164654]">Hoạt động & Công việc gần đây</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Các task được phân công gần nhất</p>
        </div>
        <Link
          href="/my-work"
          className="text-xs font-bold text-[#367ea2] transition hover:underline"
        >
          Xem tất cả ({tasks.length})
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="py-8 text-center text-xs font-medium text-slate-400">
          Chưa có hoạt động hay công việc nào được ghi nhận.
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.slice(0, 5).map((task) => {
            const dueInfo = describeDueDate(task.dueDate);
            const isDone = task.status === "DONE";

            return (
              <li key={task.id}>
                <Link
                  href={`/workspaces/${task.workspaceId}/projects/${task.projectId}/tasks/${task.id}`}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-all hover:border-[#367ea2]/60 hover:bg-[#b1dff6]/10 hover:shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold text-[#164654] group-hover:text-[#367ea2] transition-colors">
                        [{task.taskCode}] {task.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                        {task.projectName} • {task.workspaceName}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        dueInfo.tone === "danger"
                          ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                          : dueInfo.tone === "warning"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {dueInfo.label}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatRelativeTime(task.updatedAt)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
