import { TaskPriority } from "../types/task.type";

type TaskPriorityBadgeProps = {
  priority: TaskPriority;
};

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "border-zinc-200 bg-zinc-100 text-zinc-600",
  MEDIUM: "border-sky-100 bg-sky-50 text-sky-700",
  HIGH: "border-amber-100 bg-amber-50 text-amber-700",
  URGENT: "border-red-100 bg-red-50 text-red-700",
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityStyles[priority]}`}
    >
      {priority}
    </span>
  );
}
