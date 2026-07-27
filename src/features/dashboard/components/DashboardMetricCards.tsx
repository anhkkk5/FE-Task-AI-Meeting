"use client";

import Link from "next/link";
import { ArrowUpRight, Boxes, FolderKanban, ListChecks, Users } from "lucide-react";
import { WorkspacesOverviewSummary } from "@/features/stats/types/stats.type";

type DashboardMetricCardsProps = {
  summary: WorkspacesOverviewSummary | null;
  myTasksCount: number;
  dueTodayCount: number;
  isPending: boolean;
};

export function DashboardMetricCards({
  summary,
  myTasksCount,
  dueTodayCount,
  isPending,
}: DashboardMetricCardsProps) {
  const cards = [
    {
      id: "dashboard-metric-workspaces",
      label: "Workspace",
      value: summary?.workspaces,
      trend: summary?.workspaces ? `${summary.workspaces} đang hoạt động` : "Đang hoạt động",
      hint: "Xem tất cả",
      href: "/workspaces",
      icon: Boxes,
      badgeColor: "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
      iconBg: "bg-indigo-500/10 text-indigo-600 border border-indigo-200/50",
    },
    {
      id: "dashboard-metric-projects",
      label: "Dự án đang chạy",
      value: summary?.projects,
      trend: summary?.projects ? `${summary.projects} dự án active` : "Đang vận hành",
      hint: "Danh sách dự án",
      href: "/workspaces",
      icon: FolderKanban,
      badgeColor: "text-sky-600 bg-sky-50 border border-sky-200/60",
      iconBg: "bg-sky-500/10 text-sky-600 border border-sky-200/50",
    },
    {
      id: "dashboard-metric-tasks",
      label: "Công việc của tôi",
      value: myTasksCount || (summary?.tasks ?? 0),
      trend: dueTodayCount > 0 ? `${dueTodayCount} việc đến hạn hôm nay` : "Đang thực hiện",
      hint: "Việc của tôi",
      href: "/my-work",
      icon: ListChecks,
      badgeColor: dueTodayCount > 0 
        ? "text-amber-700 bg-amber-50 border border-amber-200/80 font-extrabold"
        : "text-emerald-600 bg-emerald-50 border border-emerald-200/60",
      iconBg: "bg-emerald-500/10 text-emerald-600 border border-emerald-200/50",
    },
    {
      id: "dashboard-metric-members",
      label: "Thành viên",
      value: summary?.members,
      trend: summary?.members ? `${summary.members} người dùng` : "Thành viên nhóm",
      hint: "Quản lý nhóm",
      href: "/workspaces",
      icon: Users,
      badgeColor: "text-purple-600 bg-purple-50 border border-purple-200/60",
      iconBg: "bg-purple-500/10 text-purple-600 border border-purple-200/50",
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
            className="group rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#367ea2] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} shadow-2xs`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${card.badgeColor}`}>
                {card.trend}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-3xl font-extrabold tracking-tight text-[#164654]">
                {isPending || card.value === undefined ? "—" : card.value}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {card.label}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-[#367ea2] group-hover:underline">
                {card.hint}
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#367ea2]" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
