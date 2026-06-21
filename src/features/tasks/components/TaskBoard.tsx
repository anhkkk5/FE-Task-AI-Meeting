import { Task, TaskStatus } from "../types/task.type";
import { TaskPriorityBadge } from "./TaskPriorityBadge";

type TaskBoardProps = {
  items: Task[];
};

const columns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "REVIEW", label: "Review" },
  { status: "DONE", label: "Done" },
];

export function TaskBoard({ items }: TaskBoardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => {
        const columnTasks = items.filter((task) => task.status === column.status);

        return (
          <section
            key={column.status}
            className="min-h-[360px] rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900">
                {column.label}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3"
                >
                  <p className="mb-1 font-mono text-[10px] font-bold text-zinc-500">
                    {task.taskCode}
                  </p>
                  <h3 className="line-clamp-2 text-xs font-bold leading-5 text-zinc-900">
                    {task.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <TaskPriorityBadge priority={task.priority} />
                    <span className="truncate text-[10px] font-semibold text-zinc-500">
                      {task.assignee?.fullName ?? "Chưa gán"}
                    </span>
                  </div>
                </article>
              ))}

              {columnTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs font-semibold text-zinc-400">
                  Không có task
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
