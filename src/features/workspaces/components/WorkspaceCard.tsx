import Link from "next/link";
import { Workspace } from "../types/workspace.type";

type WorkspaceCardProps = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const role = workspace.role ?? workspace.myRole ?? "MEMBER";
  
  // Xác định màu sắc badge dựa trên vai trò
  const roleBadgeColor = 
    role === "OWNER" 
      ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
      : role === "SCRUM_MASTER"
      ? "bg-purple-50 text-purple-700 border-purple-100"
      : role === "PROJECT_MANAGER"
      ? "bg-sky-50 text-sky-700 border-sky-100"
      : "bg-zinc-50 text-zinc-600 border-zinc-100";

  // Xác định màu sắc badge dựa trên trạng thái
  const statusBadgeColor =
    workspace.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <article className="border border-zinc-200/80 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[180px]">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-zinc-900">
              {workspace.name}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 font-mono">@{workspace.slug}</p>
          </div>
          <div className="flex shrink-0 gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            <span className={`border px-2 py-0.5 rounded-md ${roleBadgeColor}`}>
              {role}
            </span>
            <span className={`border px-2 py-0.5 rounded-md ${statusBadgeColor}`}>
              {workspace.status}
            </span>
          </div>
        </div>
        {workspace.description ? (
          <p className="line-clamp-2 text-xs text-zinc-600 leading-relaxed">
            {workspace.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-400 italic">Không có mô tả cho không gian làm việc này.</p>
        )}
      </div>
      <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap gap-2">
        <Link
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${workspace.id}`}
        >
          Chi tiết
        </Link>
        <Link
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${workspace.id}/projects`}
        >
          Dự án
        </Link>
        <Link
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${workspace.id}/settings`}
        >
          Cài đặt
        </Link>
      </div>
    </article>
  );
}
