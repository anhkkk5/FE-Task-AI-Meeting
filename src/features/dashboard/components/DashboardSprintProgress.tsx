"use client";

import { useMemo } from "react";
import { Calendar, CheckCircle2, Clock, PlayCircle, StopCircle } from "lucide-react";
import { DashboardSprint, ProductivityPoint } from "@/features/stats/types/stats.type";
import { formatDate } from "@/lib/utils/relative-time";

type DashboardSprintProgressProps = {
  sprint: DashboardSprint | null;
  tasksBreakdown: { status: string; total: number }[];
  productivity: ProductivityPoint[];
  isLoading: boolean;
};

export function DashboardSprintProgress({
  sprint,
  tasksBreakdown,
  productivity,
  isLoading,
}: DashboardSprintProgressProps) {
  const countsByStatus = useMemo(() => {
    const map = new Map<string, number>();
    tasksBreakdown.forEach((item) => map.set(item.status, item.total));
    return map;
  }, [tasksBreakdown]);

  const doneCount = countsByStatus.get("DONE") ?? sprint?.doneTasks ?? 0;
  const inProgressCount = countsByStatus.get("IN_PROGRESS") ?? 0;
  const inReviewCount = countsByStatus.get("IN_REVIEW") ?? 0;
  const todoCount = countsByStatus.get("TODO") ?? 0;
  const totalTasks = sprint?.totalTasks || (doneCount + inProgressCount + inReviewCount + todoCount);

  // Calculate percentages
  const donePct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const inProgressPct = totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0;
  const inReviewPct = totalTasks > 0 ? Math.round((inReviewCount / totalTasks) * 100) : 0;
  const todoPct = totalTasks > 0 ? Math.max(0, 100 - donePct - inProgressPct - inReviewPct) : 0;

  // Max value for productivity chart
  const maxCompleted = useMemo(() => {
    if (!productivity || productivity.length === 0) return 5;
    const max = Math.max(...productivity.map((p) => p.completed));
    return Math.max(max, 5);
  }, [productivity]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Đang tải thông tin tiến độ...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">
              {sprint ? sprint.name : "Tiến độ & Phân bổ Công việc"}
            </h2>
            {sprint?.projectName ? (
              <span className="text-xs font-bold text-blue-600">
                • {sprint.projectName}
              </span>
            ) : null}
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/80">
              {sprint ? "Đang diễn ra" : "Tổng quan"}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {sprint
              ? `${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}`
              : "Thống kê sức khỏe và tiến độ hoàn thành các công việc"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
            {totalTasks} Công việc
          </span>
        </div>
      </div>

      {/* Main Grid: Left progress breakdown & Right Burndown / Productivity chart */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column: Task Progress Bar & Status Counts */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Tỷ lệ hoàn thành</span>
            <span className="text-sm font-extrabold text-blue-600">{donePct}%</span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 flex p-0.5 shadow-inner">
            <div
              className="h-full bg-sky-500 rounded-l-full transition-all duration-500"
              style={{ width: `${donePct}%` }}
              title={`Hoàn thành: ${doneCount} (${donePct}%)`}
            />
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${inProgressPct}%` }}
              title={`Đang làm: ${inProgressCount} (${inProgressPct}%)`}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${inReviewPct}%` }}
              title={`Đang chờ: ${inReviewCount} (${inReviewPct}%)`}
            />
            <div
              className="h-full bg-slate-300 rounded-r-full transition-all duration-500"
              style={{ width: `${todoPct}%` }}
              title={`Chưa bắt đầu: ${todoCount} (${todoPct}%)`}
            />
          </div>

          {/* Stat indicators grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-sky-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[11px] font-bold">Hoàn thành</span>
              </div>
              <span className="block text-lg font-extrabold text-slate-900">{doneCount}</span>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-indigo-600 mb-1">
                <PlayCircle className="h-4 w-4" />
                <span className="text-[11px] font-bold">Đang làm</span>
              </div>
              <span className="block text-lg font-extrabold text-slate-900">{inProgressCount}</span>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-[11px] font-bold">Đang chờ</span>
              </div>
              <span className="block text-lg font-extrabold text-slate-900">{inReviewCount}</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                <StopCircle className="h-4 w-4" />
                <span className="text-[11px] font-bold">Chưa làm</span>
              </div>
              <span className="block text-lg font-extrabold text-slate-900">{todoCount}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Burndown / Daily Productivity Chart */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
            <span>Tiến độ hoàn thành theo ngày</span>
            <span className="text-[11px] text-slate-400 font-semibold">7 ngày gần nhất</span>
          </div>

          {/* Simple Clean Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2 border-b border-slate-200 px-2">
            {(productivity && productivity.length > 0
              ? productivity
              : Array.from({ length: 7 }, (_, i) => ({
                  date: `Ngày ${i + 1}`,
                  completed: 0,
                }))
            ).map((item, idx) => {
              const heightPct = maxCompleted > 0 ? (item.completed / maxCompleted) * 100 : 0;
              const dateLabel = item.date.length > 5 ? item.date.slice(5) : item.date;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-extrabold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                    {item.completed}
                  </span>
                  <div
                    className="w-full max-w-[28px] rounded-t-lg bg-blue-600 transition-all group-hover:bg-blue-700"
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
