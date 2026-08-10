import Link from "next/link";
import { Task } from "../types/task.type";

type TaskCardProps = {
  task: Task;
  workspaceId: string;
  projectId: string;
};

const statusStyles: Record<Task["status"], string> = {
  BACKLOG: "border-zinc-200 bg-zinc-100 text-zinc-600",
  TODO: "border-sky-100 bg-sky-50 text-sky-700",
  IN_PROGRESS: "border-emerald-100 bg-emerald-50 text-emerald-700",
  REVIEW: "border-violet-100 bg-violet-50 text-violet-700",
  DONE: "border-indigo-100 bg-indigo-50 text-indigo-700",
  CANCELLED: "border-red-100 bg-red-50 text-red-700",
};

const priorityStyles = { LOW: "bg-slate-100 text-slate-600", MEDIUM: "bg-blue-50 text-blue-700", HIGH: "bg-amber-50 text-amber-700", URGENT: "bg-rose-50 text-rose-700" };

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("vi-VN");
}

export function TaskCard({ task, workspaceId, projectId }: TaskCardProps) {
  return (
    <article className="flex min-h-[210px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="mb-1 inline-block rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-600">
              {task.taskCode}
            </span>
            <h2 className="line-clamp-2 text-base font-bold leading-tight text-zinc-900">
              {task.title}
            </h2>
          </div>
          <span
            className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles[task.status]}`}
          >
            {task.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">{task.taskType}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityStyles[task.priority]}`}>{task.priority}</span>
          {task.isBlocked ? <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">Đang bị chặn</span> : null}
          {task.isBlocking ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Đang chặn Task khác</span> : null}
        </div>

        {task.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600">
            {task.description}
          </p>
        ) : (
          <p className="text-xs italic text-zinc-400">
            Task này chưa có mô tả chi tiết.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Assignee
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-zinc-800">
              {task.assignee?.fullName ?? "Chưa gán"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Sprint
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-zinc-800">
              {task.sprint?.name ?? "Backlog"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Due date
            </p>
            <p className="mt-1 text-xs font-semibold text-zinc-800">
              {formatDate(task.dueDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <Link
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
          href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`}
        >
          Chi tiết
        </Link>
      </div>
    </article>
  );
}
