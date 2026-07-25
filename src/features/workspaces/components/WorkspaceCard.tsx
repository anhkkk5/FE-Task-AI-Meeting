import Link from "next/link";
import { Workspace } from "../types/workspace.type";
import { Folder, Users, Clock, Eye, Settings, Boxes } from "lucide-react";

type WorkspaceCardProps = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const role = workspace.role ?? workspace.myRole ?? "MEMBER";
  
  // Xác định màu sắc badge dựa trên trạng thái
  const statusBadgeColor =
    workspace.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : workspace.status === "ARCHIVED"
      ? "bg-red-50 text-red-600 border-red-100"
      : "bg-orange-50 text-orange-600 border-orange-100"; // Assuming Pending or other

  const statusLabel =
    workspace.status === "ACTIVE"
      ? "Active"
      : workspace.status === "ARCHIVED"
      ? "Archived"
      : "Pending";

  return (
    <article className="border border-zinc-200/80 bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Boxes className="h-6 w-6" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="truncate text-[15px] font-bold text-zinc-900">
              {workspace.name}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 font-medium">@{workspace.slug}</p>
          </div>
        </div>
        <div className="flex shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide border ${statusBadgeColor}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              workspace.status === "ACTIVE" ? "bg-emerald-500" : workspace.status === "ARCHIVED" ? "bg-red-500" : "bg-orange-500"
            }`}></span>
            {statusLabel}
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex-1">
        {workspace.description ? (
          <p className="line-clamp-2 text-sm text-zinc-600 leading-relaxed">
            {workspace.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-400 italic">Không có mô tả cho không gian làm việc này.</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 py-4 border-t border-b border-zinc-100/80">
        <div className="flex flex-col items-center justify-center bg-zinc-50/50 rounded-xl py-2">
          <Users className="h-4 w-4 text-zinc-400 mb-1" />
          <span className="text-sm font-bold text-zinc-900">12</span>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Thành viên</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-zinc-50/50 rounded-xl py-2">
          <Folder className="h-4 w-4 text-zinc-400 mb-1" />
          <span className="text-sm font-bold text-zinc-900">5</span>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Dự án</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-zinc-50/50 rounded-xl py-2">
          <Clock className="h-4 w-4 text-zinc-400 mb-1" />
          <span className="text-sm font-bold text-zinc-900">2h</span>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Cập nhật</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-2 py-2 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${workspace.id}`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Chi tiết</span>
        </Link>
        <Link
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-2 py-2 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${workspace.id}/projects`}
        >
          <Folder className="h-3.5 w-3.5" />
          <span>Dự án</span>
        </Link>
        <Link
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-2 py-2 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${workspace.id}/settings`}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Cài đặt</span>
        </Link>
      </div>
    </article>
  );
}
