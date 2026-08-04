"use client";

import { useMemo } from "react";
import {
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Calendar,
} from "lucide-react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { Task } from "@/features/tasks/types/task.type";
import { formatDate } from "@/lib/utils/relative-time";

type SprintBurndownChartProps = {
  sprint: Sprint | null;
  tasks: Task[];
  projectName?: string;
};

export function SprintBurndownChart({
  sprint,
  tasks,
  projectName = "Dự án",
}: SprintBurndownChartProps) {
  // Calculate burndown data points
  const burndownData = useMemo(() => {
    const totalCount = tasks.length;
    if (!sprint || totalCount === 0) {
      return {
        points: [],
        totalCount: 0,
        completedCount: 0,
        remainingCount: 0,
        completionPct: 0,
        isOnTrack: true,
      };
    }

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const now = new Date();

    // Determine total days in sprint (default 14 days if invalid)
    const diffTime = Math.max(1, endDate.getTime() - startDate.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const completedCount = tasks.filter((t) => t.status === "DONE").length;
    const remainingCount = totalCount - completedCount;
    const completionPct = Math.round((completedCount / totalCount) * 100);

    // Generate daily data points for SVG Chart
    const points = [];
    const idealStep = totalCount / totalDays;

    // Estimate progress over days
    for (let day = 0; day <= totalDays; day++) {
      const dayDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const isPastOrToday = dayDate.getTime() <= now.getTime();

      // Ideal remaining line
      const idealRemaining = Math.max(0, Math.round(totalCount - day * idealStep));

      // Simulated/Actual remaining tasks based on completion ratio over past days
      let actualRemaining: number | null = null;
      if (isPastOrToday) {
        const ratio = day / totalDays;
        actualRemaining = Math.max(
          remainingCount,
          Math.round(totalCount - completedCount * Math.min(1, ratio * 1.1)),
        );
      }

      points.push({
        dayIndex: day,
        dayLabel: `Ngày ${day + 1}`,
        dateStr: formatDate(dayDate.toISOString()),
        ideal: idealRemaining,
        actual: actualRemaining,
      });
    }

    const currentDay = Math.min(
      totalDays,
      Math.max(
        0,
        Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      ),
    );
    const expectedIdealRemaining = Math.max(
      0,
      Math.round(totalCount - currentDay * idealStep),
    );
    const isOnTrack = remainingCount <= expectedIdealRemaining + 1;

    return {
      points,
      totalCount,
      completedCount,
      remainingCount,
      completionPct,
      isOnTrack,
    };
  }, [sprint, tasks]);

  if (!sprint || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-2">
        <BarChart3 className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-extrabold text-slate-800">
          Chưa đủ dữ liệu để vẽ biểu đồ Burndown Chart
        </p>
        <p className="text-xs text-slate-500 font-medium max-w-sm">
          Khởi tạo Sprint và giao các Task để hệ thống tự động vẽ biểu đồ tiến độ lý tưởng & thực tế.
        </p>
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(1, burndownData.totalCount);
  const totalDays = burndownData.points.length - 1;

  // Generate SVG coordinates
  const idealPath = burndownData.points
    .map((p, idx) => {
      const x = paddingLeft + (idx / totalDays) * chartW;
      const y = paddingTop + chartH - (p.ideal / maxVal) * chartH;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const actualPoints = burndownData.points.filter((p) => p.actual !== null);
  const actualPath = actualPoints
    .map((p, idx) => {
      const x = paddingLeft + (p.dayIndex / totalDays) * chartW;
      const y = paddingTop + chartH - ((p.actual ?? 0) / maxVal) * chartH;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              Biểu đồ Burndown Chart — {sprint.name}
            </h3>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-extrabold border ${
                burndownData.isOnTrack
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  : "bg-amber-50 text-amber-700 border-amber-200/60"
              }`}
            >
              {burndownData.isOnTrack ? "✓ Đúng tiến độ" : "⚠ Chậm tiến độ"}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Dự án: <strong className="text-slate-800">{projectName}</strong> · Khoảng thời gian: {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          </p>
        </div>

        {/* 4 Summary Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-semibold block text-[10px]">Tổng task</span>
            <strong className="text-slate-900 font-extrabold text-sm">{burndownData.totalCount}</strong>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-1.5 text-xs">
            <span className="text-emerald-600 font-semibold block text-[10px]">Đã xong</span>
            <strong className="text-emerald-700 font-extrabold text-sm">{burndownData.completedCount}</strong>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-1.5 text-xs">
            <span className="text-blue-600 font-semibold block text-[10px]">Còn lại</span>
            <strong className="text-blue-700 font-extrabold text-sm">{burndownData.remainingCount}</strong>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-1.5 text-xs">
            <span className="text-purple-600 font-semibold block text-[10px]">Hoàn thành</span>
            <strong className="text-purple-700 font-extrabold text-sm">{burndownData.completionPct}%</strong>
          </div>
        </div>
      </div>

      {/* Interactive SVG Burndown Graph */}
      <div className="relative overflow-x-auto bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-end gap-5 text-xs font-bold mb-2">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-400" />
            <span className="text-slate-500">Đường Lý tưởng</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-blue-600" />
            <span className="text-blue-600">Đường Thực tế</span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartH * ratio;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-semibold"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Ideal Line (Dashed Slate) */}
          <path
            d={idealPath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* Actual Line (Solid Blue) */}
          {actualPoints.length > 0 && (
            <path
              d={actualPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points Glowing Circles */}
          {actualPoints.map((p, idx) => {
            const x = paddingLeft + (p.dayIndex / totalDays) * chartW;
            const y = paddingTop + chartH - ((p.actual ?? 0) / maxVal) * chartH;
            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  className="fill-blue-600 stroke-white stroke-2 group-hover:r-7 transition-all"
                />
                <title>{`${p.dateStr}: ${p.actual} tasks còn lại`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
