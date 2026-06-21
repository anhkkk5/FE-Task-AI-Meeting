import { Task } from "../types/task.type";
import { TaskCard } from "./TaskCard";

type TaskListProps = {
  items: Task[];
  workspaceId: string;
  projectId: string;
};

export function TaskList({ items, workspaceId, projectId }: TaskListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-14 text-center shadow-sm">
        <p className="text-sm font-semibold text-zinc-700">
          Chưa có task nào trong dự án này.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Tạo task đầu tiên để bắt đầu quản lý backlog.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((task) => (
        <TaskCard
          key={task.id}
          projectId={projectId}
          task={task}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
