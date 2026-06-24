import { Meeting } from "../types/meeting.type";
import { MeetingCard } from "./MeetingCard";

type MeetingListProps = {
  items: Meeting[];
  workspaceId: string;
  projectId: string;
  emptyText: string;
};

export function MeetingList({
  items,
  workspaceId,
  projectId,
  emptyText,
}: MeetingListProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
        <p className="text-sm font-bold text-zinc-600">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          projectId={projectId}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
