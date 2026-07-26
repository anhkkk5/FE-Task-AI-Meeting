"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { getWorkspacesOverview } from "@/features/stats/api/stats.api";
import { WorkspacesOverview } from "@/features/stats/types/stats.type";
import { Workspace, WorkspaceStatus } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Plus, Folder, Network, Users, Calendar } from "lucide-react";

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
        // Gọi song song để không cộng dồn thời gian chờ, nhưng dùng allSettled:
        // danh sách workspace là dữ liệu chính, không được mất chỉ vì stats lỗi.
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
          // Stats lỗi thì các card tổng hợp hiện dấu "—" thay vì số sai.
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

  // Map theo workspaceId để mỗi card tra cứu số liệu của chính nó, thay vì lặp mảng.
  const statsByWorkspace = useMemo(() => {
    return new Map(
      (overview?.workspaces ?? []).map((item) => [item.workspaceId, item]),
    );
  }, [overview]);

  // Chưa có số liệu thì hiện gạch ngang thay vì số 0 gây hiểu nhầm.
  const summaryValue = (value: number | undefined) =>
    value === undefined ? "—" : String(value);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Workspace</h1>
            <p className="mt-0.5 text-sm font-medium text-slate-500">
              Manage all your workspaces
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              type="button"
              onClick={() => void loadWorkspaces()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <Link
              className="flex items-center gap-2 h-10 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 shadow-sm transition"
              href="/workspaces/create"
            >
              <Plus className="h-4 w-4" />
              Tạo Workspace
            </Link>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workspaces</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{items.length}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projects</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{summaryValue(overview?.summary.projects)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Members</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{summaryValue(overview?.summary.members)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meetings</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{summaryValue(overview?.summary.meetings)}</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
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
              className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all duration-200 min-h-[220px]"
            >
              <div className="h-12 w-12 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Thêm Workspace mới</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Tạo một không gian cộng tác mới cho đội ngũ của bạn</p>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

