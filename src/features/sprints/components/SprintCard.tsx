import Link from "next/link";
import { Sprint } from "../types/sprint.type";
import { SprintStatusBadge } from "./SprintStatusBadge";

type SprintCardProps = {
  sprint: Sprint;
  workspaceId: string;
  projectId: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("vi-VN");
}

export function SprintCard({ sprint, workspaceId, projectId }: SprintCardProps) {
  return (
    <article className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Sprint
            </p>
            <h2 className="truncate text-base font-bold leading-tight text-zinc-900">
              {sprint.name}
            </h2>
          </div>
          <SprintStatusBadge status={sprint.status} />
        </div>

        {sprint.goal ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600">
            {sprint.goal}
          </p>
        ) : (
          <p className="text-xs italic text-zinc-400">
            Sprint này chưa có mục tiêu cụ thể.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Bắt đầu
            </dt>
            <dd className="mt-1 text-xs font-semibold text-zinc-800">
              {formatDate(sprint.startDate)}
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Kết thúc
            </dt>
            <dd className="mt-1 text-xs font-semibold text-zinc-800">
              {formatDate(sprint.endDate)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
        <Link
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
          href={`/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprint.id}`}
        >
          Chi tiết
        </Link>
        <Link
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
          href={`/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprint.id}/board`}
        >
          Board
        </Link>
        {sprint.status === "PLANNED" ? (
          <Link
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
            href={`/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprint.id}/settings`}
          >
            Chỉnh sửa
          </Link>
        ) : null}
      </div>
    </article>
  );
}
