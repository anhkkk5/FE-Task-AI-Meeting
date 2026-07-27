"use client";

import Link from "next/link";
import { ArrowRight, Bot, Sparkles, TrendingUp, Users } from "lucide-react";
import { MyWorkTask } from "@/features/my-work/types/my-work.type";
import { WorkspacesOverviewSummary } from "@/features/stats/types/stats.type";

type DashboardAiSuggestionsProps = {
  summary: WorkspacesOverviewSummary | null;
  tasks: MyWorkTask[];
};

export function DashboardAiSuggestions({
  summary,
  tasks,
}: DashboardAiSuggestionsProps) {
  // Generate real dynamic insights based on real user data
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "DONE",
  );

  const suggestions = [
    {
      id: "suggestion-sprint",
      title: "Tăng tốc Sprint & Tiến độ",
      description:
        overdueTasks.length > 0
          ? `Có ${overdueTasks.length} công việc đã quá hạn cần hoàn thành gấp để duy trì tiến độ.`
          : inProgressTasks.length > 0
          ? `${inProgressTasks.length} công việc đang thực hiện có thể tập trung dứt điểm trong ngày.`
          : "Các công việc hiện tại đang giữ tiến độ ổn định, sẵn sàng giao ban Sprint.",
      icon: TrendingUp,
    },
    {
      id: "suggestion-resources",
      title: "Phân bổ nguồn lực & Dự án",
      description:
        summary?.projects && summary.projects > 0
          ? `Đang có ${summary.projects} dự án active với ${summary.members || 1} thành viên tham gia.`
          : "Tạo dự án mới trong Workspace để kích hoạt theo dõi tiến độ và báo cáo AI.",
      icon: Users,
    },
  ];

  return (
    <div className="rounded-3xl border border-[#c9dfea] bg-gradient-to-br from-white via-indigo-50/30 to-slate-50 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#367ea2]">
          <Sparkles className="h-4 w-4 text-purple-600" />
          Gợi ý thông minh từ AI
        </div>
        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
          Agile AI Copilot
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {suggestions.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href="/workspaces"
              className="group flex items-start gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-2xs transition-all hover:border-[#367ea2] hover:bg-white hover:shadow-xs"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-105 transition-transform">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#164654] group-hover:text-[#367ea2] transition-colors">
                  {item.title}
                </span>
                <span className="block text-[11px] font-medium text-slate-500 leading-relaxed mt-0.5">
                  {item.description}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#367ea2]" />
            </Link>
          );
        })}
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#367ea2] transition hover:underline"
        >
          <span>Xem tất cả gợi ý & Báo cáo AI</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
