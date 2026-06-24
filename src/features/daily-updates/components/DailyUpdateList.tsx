import { DailyUpdate } from "../types/daily-update.type";
import { DailyUpdateCard } from "./DailyUpdateCard";

type DailyUpdateListProps = {
  items: DailyUpdate[];
  workspaceId: string;
  projectId: string;
  emptyText: string;
};

export function DailyUpdateList({
  items,
  workspaceId,
  projectId,
  emptyText,
}: DailyUpdateListProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm font-semibold text-zinc-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((dailyUpdate) => (
        <DailyUpdateCard
          key={dailyUpdate.id}
          dailyUpdate={dailyUpdate}
          projectId={projectId}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
