import { Meeting } from "../types/meeting.type";
import { MeetingCard } from "./MeetingCard";

type MeetingListProps = {
  items: Meeting[];
  workspaceId: string;
  projectId: string;
  emptyText: string;
  currentUserId?: string;
  canManage?: boolean;
  deletingMeetingId?: string | null;
  onDelete?: (meeting: Meeting) => void;
};

export function MeetingList({
  items,
  workspaceId,
  projectId,
  emptyText,
  currentUserId,
  canManage,
  deletingMeetingId,
  onDelete,
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
          canDelete={Boolean(canManage || meeting.createdBy === currentUserId)}
          isDeleting={deletingMeetingId === meeting.id}
          meeting={meeting}
          projectId={projectId}
          workspaceId={workspaceId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
