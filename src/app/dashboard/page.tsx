"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  FolderKanban,
  ListChecks,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardAiSuggestions } from "@/features/dashboard/components/DashboardAiSuggestions";
import { DashboardMetricCards } from "@/features/dashboard/components/DashboardMetricCards";
import { DashboardRecentActivity } from "@/features/dashboard/components/DashboardRecentActivity";
import { DashboardSprintProgress } from "@/features/dashboard/components/DashboardSprintProgress";
import { DashboardWorkspaceList } from "@/features/dashboard/components/DashboardWorkspaceList";
import { getMyWork } from "@/features/my-work/api/my-work.api";
import { MyWorkData } from "@/features/my-work/types/my-work.type";
import {
  getWorkspaceDashboard,
  getWorkspacesOverview,
} from "@/features/stats/api/stats.api";
import {
  WorkspaceDashboard,
  WorkspacesOverview,
} from "@/features/stats/types/stats.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [overview, setOverview] = useState<WorkspacesOverview | null>(null);
  const [myWorkData, setMyWorkData] = useState<MyWorkData | null>(null);
  const [workspaceDashboard, setWorkspaceDashboard] =
    useState<WorkspaceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setMessage("");

    try {
      // 1. Fetch workspaces, overview stats, and user tasks concurrently
      const [workspacesRes, overviewRes, myWorkRes] = await Promise.allSettled([
        getMyWorkspaces("ACTIVE"),
        getWorkspacesOverview(),
        getMyWork(user.id),
      ]);

      let loadedWorkspaces: Workspace[] = [];

      if (workspacesRes.status === "fulfilled") {
        loadedWorkspaces = workspacesRes.value.data.items;
        setWorkspaces(loadedWorkspaces);
      } else {
        setWorkspaces([]);
        setMessage(
          workspacesRes.reason instanceof Error
            ? workspacesRes.reason.message
            : "Tải danh sách workspace thất bại.",
        );
      }

      if (overviewRes.status === "fulfilled") {
        setOverview(overviewRes.value.data);
      } else {
        setOverview(null);
      }

      if (myWorkRes.status === "fulfilled") {
        setMyWorkData(myWorkRes.value);
      } else {
        setMyWorkData(null);
      }

      // 2. Fetch specific workspace dashboard for the primary workspace to get active sprint & productivity
      if (loadedWorkspaces.length > 0) {
        try {
          const wsDashRes = await getWorkspaceDashboard(loadedWorkspaces[0].id);
          if (wsDashRes.success && wsDashRes.data) {
            setWorkspaceDashboard(wsDashRes.data);
          }
        } catch {
          // Ignore individual workspace stat errors gracefully
          setWorkspaceDashboard(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statsByWorkspace = useMemo(
    () =>
      new Map((overview?.workspaces ?? []).map((item) => [item.workspaceId, item])),
    [overview],
  );

  // Compute due today count from real user tasks
  const dueTodayCount = useMemo(() => {
    if (!myWorkData?.tasks) return 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    return myWorkData.tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate.slice(0, 10) === todayStr && t.status !== "DONE";
    }).length;
  }, [myWorkData]);

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
        {/* Header Section (Ảnh 2) */}
        <div className="rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#b1dff6]/40 px-3.5 py-1 text-xs font-bold text-[#164654]">
                <Sparkles className="h-3.5 w-3.5 text-[#367ea2]" />
                Agile AI Management Dashboard
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-[#164654] sm:text-3xl">
                {getTimeGreeting()}, {user?.fullName ?? "bạn"} 👋
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                Theo dõi tiến độ dự án và công việc của đội nhóm
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
                <RefreshCw
                  className={`h-4 w-4 text-[#367ea2] ${isLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </button>
              <Link
                href="/workspaces/create"
                id="dashboard-create-workspace"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#367ea2] px-5 text-xs font-bold text-white shadow-md shadow-[#367ea2]/25 transition hover:bg-[#2b6887] active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Tạo workspace
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

        {/* 4 Thẻ KPI Metric Cards (Dữ liệu thật) */}
        <DashboardMetricCards
          summary={overview?.summary ?? null}
          myTasksCount={myWorkData?.tasks?.length ?? 0}
          dueTodayCount={dueTodayCount}
          isPending={isLoading && !overview}
        />

        {/* Bố cục chính 2 Cột (2/3 + 1/3) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột trái 2 Cols */}
          <div className="space-y-6 lg:col-span-2">
            {/* Thống kê Tiến độ Sprint & Sức khỏe công việc thực tế */}
            <DashboardSprintProgress
              sprint={workspaceDashboard?.sprint ?? null}
              tasksBreakdown={workspaceDashboard?.taskStatusBreakdown ?? []}
              productivity={workspaceDashboard?.productivity ?? []}
              isLoading={isLoading && !workspaceDashboard}
            />

            {/* Danh sách Workspace gần đây dạng bảng (Ảnh 2) */}
            <DashboardWorkspaceList
              workspaces={workspaces}
              statsByWorkspace={statsByWorkspace}
              isLoading={isLoading && workspaces.length === 0}
            />
          </div>

          {/* Cột phải Sidebar 1 Col */}
          <div className="space-y-6">
            {/* Hoạt động & Công việc gần đây thực tế */}
            <DashboardRecentActivity
              tasks={myWorkData?.tasks ?? []}
              isLoading={isLoading && !myWorkData}
            />

            {/* Thẻ Gợi ý từ AI thông minh */}
            <DashboardAiSuggestions
              summary={overview?.summary ?? null}
              tasks={myWorkData?.tasks ?? []}
            />

            {/* Khung Truy cập nhanh */}
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
                  className="group flex flex-row items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all hover:border-[#367ea2] hover:bg-[#b1dff6]/15 hover:shadow-xs"
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
