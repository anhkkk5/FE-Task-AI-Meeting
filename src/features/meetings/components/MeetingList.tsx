import { Meeting } from "../types/meeting.type";
import { MeetingCard } from "./MeetingCard";
import Link from "next/link";
import { CalendarDays, MessageCircleMore, Plus, Sparkles } from "lucide-react";

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
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_42%)]" />
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
          <CalendarDays className="h-14 w-14 text-blue-500" />
          <div className="absolute -right-1 bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white">
            <MessageCircleMore className="h-5 w-5" />
          </div>
          <Sparkles className="absolute -left-5 top-2 h-4 w-4 text-blue-300" />
          <Sparkles className="absolute -right-6 top-6 h-3 w-3 text-blue-300" />
        </div>
        <h2 className="relative mt-6 text-xl font-extrabold text-slate-900">Chưa có cuộc họp nào</h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{emptyText}</p>
        {canManage ? (
          <Link className="relative mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700" href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/create`}>
            <Plus className="h-4 w-4" /> Tạo cuộc họp đầu tiên
          </Link>
        ) : null}
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
