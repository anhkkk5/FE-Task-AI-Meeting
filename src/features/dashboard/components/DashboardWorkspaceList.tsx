"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, Plus, Users } from "lucide-react";
import { ProductOutlined } from "@ant-design/icons";
import { WorkspaceStatItem } from "@/features/stats/types/stats.type";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type DashboardWorkspaceListProps = {
  workspaces: Workspace[];
  statsByWorkspace: Map<string, WorkspaceStatItem>;
  isLoading: boolean;
};

// Custom avatar color themes for workspaces
const AVATAR_STYLES = [
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
];

export function DashboardWorkspaceList({
  workspaces,
  statsByWorkspace,
  isLoading,
}: DashboardWorkspaceListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-14 text-sm font-semibold text-slate-500 shadow-xs">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Đang tải danh sách Workspace...
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-14 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
          <ProductOutlined className="text-2xl" />
        </div>
        <div>
          <p className="text-base font-extrabold text-slate-900">
            Bạn chưa có Workspace nào
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Tạo workspace đầu tiên để bắt đầu quản lý dự án và công việc.
          </p>
        </div>
        <Link
          href="/workspaces/create"
          id="dashboard-empty-create-workspace"
          className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tạo Workspace mới
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Không gian làm việc gần đây</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Các workspace đang quản lý và tham gia</p>
        </div>
        <Link
          href="/workspaces"
          className="text-xs font-bold text-blue-600 transition hover:underline"
        >
          Xem tất cả ({workspaces.length})
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="px-6 py-3">Tên workspace</th>
              <th className="px-4 py-3">Dự án</th>
              <th className="px-4 py-3">Thành viên</th>
              <th className="px-4 py-3">Cập nhật gần nhất</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {workspaces.slice(0, 5).map((workspace, idx) => {
              const stats = statsByWorkspace.get(workspace.id);
              const projectCount = stats?.projectCount ?? 0;
              const memberCount = stats?.memberCount ?? 0;
              const updatedAt = stats?.updatedAt || workspace.updatedAt;
              const avatarStyle = AVATAR_STYLES[idx % AVATAR_STYLES.length];
              const initialLetter = (workspace.name.trim()[0] || "W").toUpperCase();

              return (
                <tr
                  key={workspace.id}
                  className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <Link href={`/workspaces/${workspace.id}`} className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border font-extrabold text-sm ${avatarStyle} shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        {initialLetter}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-blue-600">
                          {workspace.name}
                        </p>
                        <p className="truncate text-[11px] font-medium text-slate-400">
                          workspace-{workspace.slug}
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/70 px-3 py-1 text-xs font-bold text-slate-700">
                      <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                      <span>{projectCount} dự án</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/70 px-3 py-1 text-xs font-bold text-slate-700">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>{memberCount} thành viên</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-slate-500 font-medium">
                    {formatRelativeTime(updatedAt)}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      href={`/workspaces/${workspace.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:bg-blue-600 group-hover:text-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
