"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ListChecks,
} from "lucide-react";
import { WorkspacesOverviewSummary } from "@/features/stats/types/stats.type";

type DashboardMetricCardsProps = {
  summary: WorkspacesOverviewSummary | null;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  isPending: boolean;
};

export function DashboardMetricCards({
  summary,
  totalTasks,
  doneTasks,
  inProgressTasks,
  overdueTasks,
  isPending,
}: DashboardMetricCardsProps) {
  const cards = [
    {
      id: "dashboard-metric-total-tasks",
      label: "Công việc",
      value: totalTasks || summary?.tasks || 0,
      trend: "↑ 8% so với Sprint trước",
      trendType: "up" as const,
      hint: "Xem công việc",
      href: "/my-work",
      icon: ListChecks,
      iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
    },
    {
      id: "dashboard-metric-done-tasks",
      label: "Đã hoàn thành",
      value: doneTasks || 0,
      trend: "↑ 12% so với Sprint trước",
      trendType: "up" as const,
      hint: "Đã xong",
      href: "/my-work",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    },
    {
      id: "dashboard-metric-in-progress-tasks",
      label: "Đang thực hiện",
      value: inProgressTasks || 0,
      trend: "↑ 4% so với Sprint trước",
      trendType: "up" as const,
      hint: "Đang làm",
      href: "/my-work",
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
    },
    {
      id: "dashboard-metric-overdue-tasks",
      label: "Quá hạn",
      value: overdueTasks || 0,
      trend: "↓ 2% so với Sprint trước",
      trendType: "down" as const,
      hint: "Cần xử lý",
      href: "/my-work",
      icon: AlertCircle,
      iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.id}
            id={card.id}
            href={card.href}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-500">{card.label}</p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">
                  {isPending ? "—" : card.value}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              {card.trendType === "up" ? (
                <span className="flex items-center text-emerald-600 font-bold">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="flex items-center text-rose-600 font-bold">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                </span>
              )}
              <span className="truncate">{card.trend}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
