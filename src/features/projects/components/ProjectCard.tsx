import Link from "next/link";
import { Project } from "../types/project.type";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const status = project.status || "ACTIVE";
  
  // Xác định màu sắc badge dựa trên trạng thái
  const statusBadgeColor =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "COMPLETED"
      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <article className="border border-zinc-200/80 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[170px]">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 font-mono mb-1">
              {project.keyCode}
            </span>
            <h2 className="truncate text-base font-bold text-zinc-900 leading-tight">
              {project.name}
            </h2>
          </div>
          <span className={`shrink-0 border px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusBadgeColor}`}>
            {status}
          </span>
        </div>
        {project.description ? (
          <p className="line-clamp-2 text-xs text-zinc-600 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-400 italic">Không có mô tả cho dự án này.</p>
        )}
      </div>
      <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap gap-2">
        <Link
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
        >
          Chi tiết
        </Link>
        <Link
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
          href={`/workspaces/${project.workspaceId}/projects/${project.id}/sprints`}
        >
          Sprints
        </Link>
        <Link
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
          href={`/workspaces/${project.workspaceId}/projects/${project.id}/tasks`}
        >
          Tasks
        </Link>
        <Link
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition"
          href={`/workspaces/${project.workspaceId}/projects/${project.id}/settings`}
        >
          Cài đặt
        </Link>
      </div>
    </article>
  );
}
