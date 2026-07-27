"use client";

import Link from "next/link";
import { ArrowUpRight, Boxes, ClipboardList, FolderKanban, Users } from "lucide-react";
import { WorkspacesOverviewSummary } from "@/features/stats/types/stats.type";

type DashboardMetricCardsProps = {
  summary: WorkspacesOverviewSummary | null;
  isPending: boolean;
};

export function DashboardMetricCards({
  summary,
  isPending,
}: DashboardMetricCardsProps) {
  const cards = [
    {
      id: "dashboard-metric-workspaces",
      label: "Workspace",
      value: summary?.workspaces,
      trend: "+12% MoM",
      hint: "Xem tất cả",
      href: "/workspaces",
      icon: Boxes,
      badgeColor: "bg-[#b1dff6]/50 text-[#164654]",
      iconBg: "bg-[#367ea2]/10 text-[#367ea2]",
    },
    {
      id: "dashboard-metric-projects",
      label: "Dự án đang chạy",
      value: summary?.projects,
      trend: "Ổn định",
      hint: "Danh sách dự án",
      href: "/workspaces",
      icon: FolderKanban,
      badgeColor: "bg-emerald-100/70 text-emerald-800",
      iconBg: "bg-[#367ea2]/10 text-[#367ea2]",
    },
    {
      id: "dashboard-metric-tasks",
      label: "Tổng công việc",
      value: summary?.tasks,
      trend: "Tiến độ tốt",
      hint: "Việc của tôi",
      href: "/my-work",
      icon: ClipboardList,
      badgeColor: "bg-sky-100 text-sky-800",
      iconBg: "bg-[#367ea2]/10 text-[#367ea2]",
    },
    {
      id: "dashboard-metric-members",
      label: "Thành viên nhóm",
      value: summary?.members,
      trend: "Đội ngũ",
      hint: "Quản lý thành viên",
      href: "/workspaces",
      icon: Users,
      badgeColor: "bg-indigo-100/70 text-indigo-800",
      iconBg: "bg-[#367ea2]/10 text-[#367ea2]",
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
            className="group rounded-2xl border border-[#c9dfea]/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-[#367ea2] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${card.badgeColor}`}>
                {card.trend}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-3xl font-extrabold text-[#164654]">
                {isPending || card.value === undefined ? "—" : card.value}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {card.label}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-[#367ea2]">
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
