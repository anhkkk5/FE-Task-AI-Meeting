"use client";

import Link from "next/link";
import { ArrowRight, Boxes, ClipboardList, FolderKanban, Users } from "lucide-react";
import { WorkspacesOverviewSummary } from "@/features/stats/types/stats.type";

type DashboardMetricCardsProps = {
  summary: WorkspacesOverviewSummary | null;
  isPending: boolean;
};

/**
 * The so lieu tong quan.
 * Moi the deu la link den mot route co that: truoc day cac the nay chi la so
 * hardcode va bam vao khong di dau ca.
 */
export function DashboardMetricCards({
  summary,
  isPending,
}: DashboardMetricCardsProps) {
  const cards = [
    {
      id: "dashboard-metric-workspaces",
      label: "Workspace",
      value: summary?.workspaces,
      hint: "Xem danh sách",
      href: "/workspaces",
      icon: Boxes,
      tone: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      id: "dashboard-metric-projects",
      label: "Dự án",
      value: summary?.projects,
      hint: "Chọn workspace",
      href: "/workspaces",
      icon: FolderKanban,
      tone: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      id: "dashboard-metric-tasks",
      label: "Tổng task",
      value: summary?.tasks,
      hint: "Xem việc của tôi",
      href: "/my-work",
      icon: ClipboardList,
      tone: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      id: "dashboard-metric-members",
      label: "Thành viên",
      value: summary?.members,
      hint: "Xem theo workspace",
      href: "/workspaces",
      icon: Users,
      tone: "bg-emerald-50 text-emerald-600 border-emerald-100",
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
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isPending || card.value === undefined ? "—" : card.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 text-[11px] font-bold text-blue-600 opacity-0 transition group-hover:opacity-100">
              {card.hint}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
