import Link from "next/link";
import { Meeting } from "../types/meeting.type";

type MeetingDetailProps = {
  meeting: Meeting;
  workspaceId: string;
  projectId: string;
  canManage: boolean;
  isMutating?: boolean;
  onCancel: () => void;
  onComplete: () => void;
};

const typeLabels: Record<Meeting["meetingType"], string> = {
  SPRINT_PLANNING: "Sprint planning",
  DAILY_SCRUM: "Daily scrum",
  SPRINT_REVIEW: "Sprint review",
  RETROSPECTIVE: "Retrospective",
  GENERAL: "General",
};

function formatDateTime(value: string | null) {
  if (!value) return "Chua dat";

  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

export function MeetingDetail({
  meeting,
  workspaceId,
  projectId,
  canManage,
  isMutating,
  onCancel,
  onComplete,
}: MeetingDetailProps) {
  const canChangeStatus =
    canManage && !["CANCELLED", "ARCHIVED", "COMPLETED"].includes(meeting.status);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
              {typeLabels[meeting.meetingType]}
            </span>
            <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-600">
              {meeting.status}
            </span>
            {meeting.sprint ? (
              <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
                {meeting.sprint.name}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-2xl font-black text-zinc-950">
            {meeting.title}
          </h1>
          {meeting.description ? (
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-zinc-600">
              {meeting.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/participants`}
          >
            Participants
          </Link>
          <Link
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/transcript`}
          >
            Transcript
          </Link>
          {canChangeStatus ? (
            <>
              <button
                className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:bg-zinc-400"
                disabled={isMutating}
                type="button"
                onClick={onComplete}
              >
                Complete
              </button>
              <button
                className="h-10 rounded-xl bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:bg-zinc-400"
                disabled={isMutating}
                type="button"
                onClick={onCancel}
              >
                Cancel
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 border-t border-zinc-100 pt-5 md:grid-cols-4">
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Ngay hop
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-800">
            {meeting.meetingDate}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Bat dau
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-800">
            {formatDateTime(meeting.startTime)}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Ket thuc
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-800">
            {formatDateTime(meeting.endTime)}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Transcript
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-800">
            {meeting.mongoTranscriptId ? "Da co" : "Chua co"}
          </p>
        </div>
      </div>
    </section>
  );
}
