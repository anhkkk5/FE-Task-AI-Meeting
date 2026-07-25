"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ListChecks, Plus, RefreshCw } from "lucide-react";
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

    // Danh sach workspace la du lieu chinh, khong duoc mat chi vi stats loi,
    // nen dung allSettled thay vi Promise.all.
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Xin chào, {user?.fullName ?? "bạn"}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-slate-500">
              Tổng quan toàn bộ workspace, dự án và công việc của bạn
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="dashboard-refresh"
              type="button"
              onClick={() => void loadDashboard()}
              disabled={isLoading}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
            <Link
              href="/workspaces/create"
              id="dashboard-create-workspace"
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tạo Workspace
            </Link>
          </div>
        </div>

        {message ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {message}
          </div>
        ) : null}

        <DashboardMetricCards
          summary={overview?.summary ?? null}
          isPending={isLoading && !overview}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardWorkspaceList
              workspaces={workspaces}
              statsByWorkspace={statsByWorkspace}
              isLoading={isLoading && workspaces.length === 0}
            />
          </div>

          <aside className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Truy cập nhanh</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Task luôn thuộc một dự án, dự án thuộc một workspace. Chọn điểm
              vào bên dưới.
            </p>

            <div className="mt-4 space-y-2.5">
              <Link
                href="/my-work"
                id="dashboard-go-my-work"
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition hover:border-blue-100 hover:bg-blue-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-2xs">
                  <ListChecks className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800">
                    Việc của tôi
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Task được giao ở mọi dự án
                  </span>
                </span>
              </Link>

              <Link
                href="/workspaces"
                id="dashboard-go-workspaces"
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition hover:border-blue-100 hover:bg-blue-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-2xs">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800">
                    Chọn workspace
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Mở dự án bên trong workspace
                  </span>
                </span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
