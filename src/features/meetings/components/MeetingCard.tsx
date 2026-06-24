import Link from "next/link";
import { Meeting } from "../types/meeting.type";

type MeetingCardProps = {
  meeting: Meeting;
  workspaceId: string;
  projectId: string;
};

const typeLabels: Record<Meeting["meetingType"], string> = {
  SPRINT_PLANNING: "Sprint planning",
  DAILY_SCRUM: "Daily scrum",
  SPRINT_REVIEW: "Sprint review",
  RETROSPECTIVE: "Retrospective",
  GENERAL: "General",
};

const statusTones: Record<Meeting["status"], string> = {
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  ARCHIVED: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

function formatTime(value: string | null) {
  if (!value) return "--:--";

  return value.slice(11, 16);
}

export function MeetingCard({ meeting, workspaceId, projectId }: MeetingCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
              {typeLabels[meeting.meetingType]}
            </span>
            <span
              className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusTones[meeting.status]}`}
            >
              {meeting.status}
            </span>
            {meeting.sprint ? (
              <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
                {meeting.sprint.name}
              </span>
            ) : null}
          </div>
          <Link
            className="text-lg font-black text-zinc-950 transition hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}`}
          >
            {meeting.title}
          </Link>
          {meeting.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
              {meeting.description}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-56 grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2 text-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Ngay
            </p>
            <p className="mt-1 text-xs font-bold text-zinc-800">
              {meeting.meetingDate}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Bat dau
            </p>
            <p className="mt-1 text-xs font-bold text-zinc-800">
              {formatTime(meeting.startTime)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Ket thuc
            </p>
            <p className="mt-1 text-xs font-bold text-zinc-800">
              {formatTime(meeting.endTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <div className="text-xs font-semibold text-zinc-500">
          {meeting.participants?.length ?? 0} participants
          {meeting.mongoTranscriptId ? " - Co transcript" : " - Chua co transcript"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/participants`}
          >
            Participants
          </Link>
          <Link
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/transcript`}
          >
            Transcript
          </Link>
        </div>
      </div>
    </article>
  );
}
