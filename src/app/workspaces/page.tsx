"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  FolderKanban,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { ProductOutlined } from "@ant-design/icons";
import { AppShell } from "@/components/layout/AppShell";
import { getWorkspacesOverview } from "@/features/stats/api/stats.api";
import { WorkspacesOverview } from "@/features/stats/types/stats.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { Workspace, WorkspaceStatus } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

export default function WorkspacesPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const [status, setStatus] = useState<WorkspaceStatus | "">("");
  const [items, setItems] = useState<Workspace[]>([]);
  const [overview, setOverview] = useState<WorkspacesOverview | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadWorkspaces = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [workspacesResult, overviewResult] = await Promise.allSettled([
          getMyWorkspaces(status === "" ? undefined : status),
          getWorkspacesOverview(),
        ]);

        if (workspacesResult.status === "fulfilled") {
          setItems(workspacesResult.value.data.items);
        } else {
          setItems([]);
          setMessage(
            workspacesResult.reason instanceof Error
              ? workspacesResult.reason.message
              : "Tải danh sách không gian thất bại.",
          );
        }

        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value.data);
        } else {
          setOverview(null);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải danh sách không gian thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    if (user) {
      void loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  const statsByWorkspace = useMemo(() => {
    return new Map(
      (overview?.workspaces ?? []).map((item) => [item.workspaceId, item]),
    );
  }, [overview]);

  const summaryValue = (value: number | undefined) =>
    value === undefined ? "—" : String(value);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Toolbar Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <ProductOutlined className="text-sm text-blue-600" />
                Workspace Management
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Không gian làm việc (Workspace)
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Quản lý toàn bộ Workspace, dự án và thành viên thuộc quyền của bạn
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 active:scale-95 disabled:opacity-60"
                type="button"
                onClick={() => void loadWorkspaces()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 text-blue-600 ${isLoading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
                href="/workspaces/create"
              >
                <Plus className="h-4 w-4" />
                Tạo Workspace mới
              </Link>
            </div>
          </div>

          {/* Search bar inside header */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder="Tìm kiếm workspace theo tên hoặc slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="text-xs font-bold text-slate-500">
              Đang hiển thị <span className="font-extrabold text-blue-600">{filteredItems.length}</span> / {items.length} Workspace
            </div>
          </div>
        </div>

        {/* Top Stats KPI Cards với Font chữ rõ nét & Nhãn dễ đọc */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Workspaces */}
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:border-blue-200">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
              <ProductOutlined className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Không gian làm việc</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{items.length}</p>
            </div>
          </div>

          {/* Projects */}
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:border-emerald-200">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Dự án đang chạy</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{summaryValue(overview?.summary.projects)}</p>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:border-indigo-200">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/80">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Tổng thành viên</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{summaryValue(overview?.summary.members)}</p>
            </div>
          </div>

          {/* Meetings */}
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:border-amber-200">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Cuộc họp hàng ngày</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{summaryValue(overview?.summary.meetings)}</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-bold text-rose-800 shadow-xs">
            {message}
          </div>
        ) : null}

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                stats={statsByWorkspace.get(workspace.id)}
              />
            ))}
            
            {/* Add Workspace Card */}
            <Link 
              href="/workspaces/create"
              className="group flex min-h-[260px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 shadow-2xs transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/40"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-xs transition-all group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                <ProductOutlined className="text-2xl" />
              </div>
              <p className="text-base font-extrabold text-slate-900 transition-colors group-hover:text-blue-600">
                Thêm Workspace mới
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1 text-center max-w-xs">
                Tạo một không gian cộng tác mới cho đội ngũ của bạn
              </p>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
