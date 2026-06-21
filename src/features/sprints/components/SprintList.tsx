import { Sprint } from "../types/sprint.type";
import { SprintCard } from "./SprintCard";

type SprintListProps = {
  items: Sprint[];
  workspaceId: string;
  projectId: string;
};

export function SprintList({ items, workspaceId, projectId }: SprintListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-14 text-center shadow-sm">
        <p className="text-sm font-semibold text-zinc-700">
          Chưa có sprint nào trong dự án này.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Tạo sprint đầu tiên để bắt đầu quản lý vòng lặp làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((sprint) => (
        <SprintCard
          key={sprint.id}
          projectId={projectId}
          sprint={sprint}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
