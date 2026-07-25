"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, Plus, Users } from "lucide-react";
import { WorkspaceStatItem } from "@/features/stats/types/stats.type";
import { Workspace } from "@/features/workspaces/types/workspace.type";

type DashboardWorkspaceListProps = {
  workspaces: Workspace[];
  statsByWorkspace: Map<string, WorkspaceStatItem>;
  isLoading: boolean;
};

/**
 * Danh sach workspace tren dashboard.
 * Thay cho banner hardcode truoc day: nguoi dung tu chon workspace muon mo,
 * khong bi mac dinh vao mot workspace nao.
 */
export function DashboardWorkspaceList({
  workspaces,
  statsByWorkspace,
  isLoading,
}: DashboardWorkspaceListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-14 text-sm font-semibold text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Đang tải workspace...
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FolderKanban className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            Bạn chưa có workspace nào
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Tạo workspace đầu tiên để bắt đầu quản lý dự án và task.
          </p>
        </div>
        <Link
          href="/workspaces/create"
          id="dashboard-empty-create-workspace"
          className="mt-1 flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Tạo workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-800">Workspace của bạn</h2>
        <Link
          href="/workspaces"
          className="text-xs font-bold text-blue-600 transition hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      <ul className="divide-y divide-slate-100">
        {workspaces.slice(0, 5).map((workspace) => {
          const stats = statsByWorkspace.get(workspace.id);

          return (
            <li key={workspace.id}>
              <Link
                href={`/workspaces/${workspace.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50/80"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm shadow-blue-500/20">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {workspace.name}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-500">
                    @{workspace.slug}
                  </p>
                </div>

                <div className="hidden items-center gap-5 sm:flex">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                    {stats?.projectCount ?? "-"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {stats?.memberCount ?? "-"}
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
