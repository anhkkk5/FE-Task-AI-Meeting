"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, Plus, Users } from "lucide-react";
import { ProductOutlined } from "@ant-design/icons";
import { WorkspaceStatItem } from "@/features/stats/types/stats.type";
import { Workspace } from "@/features/workspaces/types/workspace.type";

type DashboardWorkspaceListProps = {
  workspaces: Workspace[];
  statsByWorkspace: Map<string, WorkspaceStatItem>;
  isLoading: boolean;
};

export function DashboardWorkspaceList({
  workspaces,
  statsByWorkspace,
  isLoading,
}: DashboardWorkspaceListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-3xl border border-[#c9dfea]/80 bg-white p-14 text-sm font-semibold text-slate-500 shadow-xs">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#367ea2] border-t-transparent" />
        Đang tải danh sách Workspace...
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#c9dfea]/80 bg-white p-14 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b1dff6]/30 text-[#367ea2]">
          <ProductOutlined className="text-2xl" />
        </div>
        <div>
          <p className="text-base font-extrabold text-[#164654]">
            Bạn chưa có Workspace nào
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Tạo workspace đầu tiên để bắt đầu quản lý dự án và công việc.
          </p>
        </div>
        <Link
          href="/workspaces/create"
          id="dashboard-empty-create-workspace"
          className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-[#367ea2] px-5 text-xs font-bold text-white shadow-md shadow-[#367ea2]/25 transition hover:bg-[#2b6887]"
        >
          <Plus className="h-4 w-4" />
          Tạo Workspace mới
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#c9dfea]/80 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-extrabold text-[#164654]">Không gian làm việc (Workspace)</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Theo dõi tiến độ và số lượng dự án thuộc từng Workspace</p>
        </div>
        <Link
          href="/workspaces"
          className="text-xs font-bold text-[#367ea2] transition hover:underline"
        >
          Xem tất cả ({workspaces.length})
        </Link>
      </div>

      <ul className="divide-y divide-slate-100">
        {workspaces.slice(0, 5).map((workspace) => {
          const stats = statsByWorkspace.get(workspace.id);
          const projectCount = stats?.projectCount ?? 0;
          const memberCount = stats?.memberCount ?? 0;

          return (
            <li key={workspace.id}>
              <Link
                href={`/workspaces/${workspace.id}`}
                className="group flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#367ea2]/10 text-[#367ea2] border border-[#367ea2]/20 group-hover:bg-[#367ea2] group-hover:text-white transition-all">
                    <ProductOutlined className="text-xl" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#164654] group-hover:text-[#367ea2] transition-colors">
                      {workspace.name}
                    </p>
                    <p className="truncate text-xs font-medium text-slate-400">
                      @{workspace.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/70 px-3 py-1.5 text-xs font-bold text-slate-700">
                      <FolderKanban className="h-3.5 w-3.5 text-[#367ea2]" />
                      <span>{projectCount} Dự án</span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/70 px-3 py-1.5 text-xs font-bold text-slate-700">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>{memberCount} Thành viên</span>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#367ea2]" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
