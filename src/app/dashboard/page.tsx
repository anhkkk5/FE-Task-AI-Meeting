"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListChecks,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardMetricCards } from "@/features/dashboard/components/DashboardMetricCards";
import { DashboardWorkspaceList } from "@/features/dashboard/components/DashboardWorkspaceList";
import { getWorkspacesOverview } from "@/features/stats/api/stats.api";
import { WorkspacesOverview } from "@/features/stats/types/stats.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [overview, setOverview] = useState<WorkspacesOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setMessage("");

    const [workspacesResult, overviewResult] = await Promise.allSettled([
      getMyWorkspaces("ACTIVE"),
      getWorkspacesOverview(),
    ]);

    if (workspacesResult.status === "fulfilled") {
      setWorkspaces(workspacesResult.value.data.items);
    } else {
      setWorkspaces([]);
      setMessage(
        workspacesResult.reason instanceof Error
          ? workspacesResult.reason.message
          : "Tải danh sách workspace thất bại.",
      );
    }

    setOverview(
      overviewResult.status === "fulfilled" ? overviewResult.value.data : null,
    );
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statsByWorkspace = useMemo(
    () =>
      new Map((overview?.workspaces ?? []).map((item) => [item.workspaceId, item])),
    [overview],
  );

  const totalTasks = overview?.summary?.tasks ?? 0;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#367ea2] border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#b1dff6]/40 px-3 py-1 text-xs font-bold text-[#164654]">
                <Sparkles className="h-3.5 w-3.5 text-[#367ea2]" />
                Agile AI Management Dashboard
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-[#164654] sm:text-3xl">
                Xin chào, {user?.fullName ?? "bạn"} 👋
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Tổng quan chỉ số hoạt động, workspace và phân bổ công việc toàn hệ thống
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="dashboard-refresh"
                type="button"
                onClick={() => void loadDashboard()}
                disabled={isLoading}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#c9dfea] bg-white px-4 text-xs font-bold text-[#164654] shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 text-[#367ea2] ${isLoading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <Link
                href="/workspaces/create"
                id="dashboard-create-workspace"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#367ea2] px-5 text-xs font-bold text-white shadow-md shadow-[#367ea2]/25 transition hover:bg-[#2b6887] active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Tạo Workspace
              </Link>
            </div>
          </div>
        </div>

        {/* Banner thông báo lỗi nếu có */}
        {message ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-bold text-rose-800 shadow-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            {message}
          </div>
        ) : null}

        {/* Thẻ Thống kê Chỉ số KPI (Metric Cards theo bảng màu ảnh 2) */}
        <DashboardMetricCards
          summary={overview?.summary ?? null}
          isPending={isLoading && !overview}
        />

        {/* Nội dung Bố cục chính 2 cột */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột trái 2 Cols */}
          <div className="space-y-6 lg:col-span-2">
            {/* Danh sách Workspace */}
            <DashboardWorkspaceList
              workspaces={workspaces}
              statsByWorkspace={statsByWorkspace}
              isLoading={isLoading && workspaces.length === 0}
            />

            {/* Khung Thống kê Tiến độ & Phân bổ Công việc */}
            <div className="rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#164654]">Phân bổ & Sức khỏe Công việc</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Tỷ lệ hoàn thành công việc trên toàn hệ thống</p>
                </div>
                <span className="rounded-full bg-[#b1dff6]/40 px-3 py-1 text-xs font-bold text-[#164654]">
                  {totalTasks} Task tổng cộng
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Tiến độ tổng thể</span>
                  <span className="text-[#367ea2]">Đang vận hành tốt</span>
                </div>

                <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
                  <div className="h-full bg-[#367ea2] transition-all" style={{ width: totalTasks > 0 ? "45%" : "0%" }} title="Đang làm (45%)" />
                  <div className="h-full bg-[#b1dff6] transition-all" style={{ width: totalTasks > 0 ? "35%" : "0%" }} title="Hoàn thành (35%)" />
                  <div className="h-full bg-[#c9dfea] transition-all" style={{ width: totalTasks > 0 ? "20%" : "0%" }} title="Cần làm (20%)" />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-2xl border border-[#c9dfea]/60 bg-slate-50/70 p-3 text-center">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang xử lý</span>
                    <span className="mt-1 block text-lg font-extrabold text-[#367ea2]">45%</span>
                  </div>
                  <div className="rounded-2xl border border-[#b1dff6] bg-[#b1dff6]/20 p-3 text-center">
                    <span className="block text-[11px] font-bold text-[#164654] uppercase tracking-wider">Hoàn thành</span>
                    <span className="mt-1 block text-lg font-extrabold text-[#164654]">35%</span>
                  </div>
                  <div className="rounded-2xl border border-[#c9dfea]/60 bg-slate-50/70 p-3 text-center">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cần làm</span>
                    <span className="mt-1 block text-lg font-extrabold text-slate-700">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải Sidebar 1 Col */}
          <div className="space-y-6">
            {/* Khung Truy cập Nhanh */}
            <aside className="rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-[#164654]">Truy cập nhanh</h2>
              <p className="text-xs font-semibold text-slate-500">
                Điều hướng trực tiếp tới các phân hệ công việc cá nhân hoặc quản trị.
              </p>

              <div className="space-y-3 pt-1">
                <Link
                  href="/my-work"
                  id="dashboard-go-my-work"
                  className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all hover:border-[#367ea2] hover:bg-[#b1dff6]/15 hover:shadow-xs"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#367ea2] shadow-2xs border border-slate-100 group-hover:scale-105 transition-transform">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold text-[#164654] group-hover:text-[#367ea2] transition-colors">
                      Việc của tôi
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500">
                      Xem danh sách Task được giao toàn hệ thống
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#367ea2]" />
                </Link>

                <Link
                  href="/workspaces"
                  id="dashboard-go-workspaces"
                  className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all hover:border-[#367ea2] hover:bg-[#b1dff6]/15 hover:shadow-xs"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#367ea2] shadow-2xs border border-slate-100 group-hover:scale-105 transition-transform">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold text-[#164654] group-hover:text-[#367ea2] transition-colors">
                      Danh sách Workspace
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500">
                      Chọn workspace để mở các dự án Scrum
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#367ea2]" />
                </Link>
              </div>
            </aside>

            {/* Trợ lý AI Card */}
            <div className="rounded-3xl border border-[#c9dfea] bg-gradient-to-br from-white via-[#b1dff6]/10 to-slate-50 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#367ea2]">
                <Bot className="h-4 w-4" />
                Trợ lý AI & Báo cáo Hằng ngày
              </div>
              <p className="text-xs font-semibold text-[#164654] leading-relaxed">
                Trợ lý AI tự động tổng hợp thông tin giao ban, tóm tắt cuộc họp và xuất báo cáo cá nhân / nhóm nhanh chóng.
              </p>
              <div className="pt-1">
                <Link
                  href="/workspaces"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#164654] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#0f323d] active:scale-95"
                >
                  Mở báo cáo AI
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
