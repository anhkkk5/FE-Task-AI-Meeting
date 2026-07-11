import Link from "next/link";
import { Meeting } from "../types/meeting.type";

type MeetingCardProps = {
  meeting: Meeting;
  workspaceId: string;
  projectId: string;
};

const typeLabels: Record<Meeting["meetingType"], string> = {
  SPRINT_PLANNING: "Lập kế hoạch sprint",
  DAILY_SCRUM: "Daily Scrum",
  SPRINT_REVIEW: "Review sprint",
  RETROSPECTIVE: "Retrospective",
  GENERAL: "Tổng quan",
};

const statusLabels: Record<Meeting["status"], string> = {
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  ARCHIVED: "Đã lưu trữ",
};

const statusTones: Record<Meeting["status"], string> = {
  SCHEDULED: "bg-[#e9f2ff] text-[#0c66e4]",
  COMPLETED: "bg-[#dcfff1] text-[#216e4e]",
  CANCELLED: "bg-[#fff4f2] text-[#ae2a19]",
  ARCHIVED: "bg-[#f1f2f4] text-[#44546f]",
};

function formatTime(value: string | null) {
  if (!value) return "--:--";

  return value.slice(11, 16);
}

export function MeetingCard({ meeting, workspaceId, projectId }: MeetingCardProps) {
  return (
    <article className="rounded border border-[#dfe1e6] bg-white transition hover:border-[#b3b9c4]">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#f1f2f4] px-2 py-0.5 text-xs font-semibold text-[#44546f]">
              {typeLabels[meeting.meetingType]}
            </span>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusTones[meeting.status]}`}>
              {statusLabels[meeting.status]}
            </span>
            {meeting.sprint ? (
              <span className="rounded border border-[#dfe1e6] px-2 py-0.5 text-xs font-medium text-[#44546f]">
                {meeting.sprint.name}
              </span>
            ) : null}
          </div>
          <Link
            className="text-base font-semibold text-[#172b4d] hover:text-[#0c66e4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}`}
          >
            {meeting.title}
          </Link>
          {meeting.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6b778c]">
              {meeting.description}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-56 grid-cols-3 gap-px overflow-hidden rounded border border-[#dfe1e6] bg-[#dfe1e6] text-center">
          <div className="bg-white p-2">
            <p className="text-[11px] font-semibold uppercase text-[#6b778c]">Ngày</p>
            <p className="mt-1 text-xs font-semibold text-[#172b4d]">{meeting.meetingDate}</p>
          </div>
          <div className="bg-white p-2">
            <p className="text-[11px] font-semibold uppercase text-[#6b778c]">Bắt đầu</p>
            <p className="mt-1 text-xs font-semibold text-[#172b4d]">{formatTime(meeting.startTime)}</p>
          </div>
          <div className="bg-white p-2">
            <p className="text-[11px] font-semibold uppercase text-[#6b778c]">Kết thúc</p>
            <p className="mt-1 text-xs font-semibold text-[#172b4d]">{formatTime(meeting.endTime)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe1e6] px-4 py-3">
        <div className="text-sm text-[#6b778c]">
          {meeting.participants?.length ?? 0} người tham gia
          {meeting.mongoTranscriptId ? " · Đã có biên bản" : " · Chưa có biên bản"}
          {meeting.mongoSummaryId ? " · Đã có tóm tắt" : " · Chưa có tóm tắt"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded bg-[#172b4d] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0c1f3f]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/room`}
          >
            Vào phòng
          </Link>
          <Link
            className="rounded border border-[#dfe1e6] bg-white px-3 py-1.5 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/participants`}
          >
            Người tham gia
          </Link>
          <Link
            className="rounded border border-[#dfe1e6] bg-white px-3 py-1.5 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/transcript`}
          >
            Biên bản
          </Link>
          <Link
            className="rounded border border-[#dfe1e6] bg-white px-3 py-1.5 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/summary`}
          >
            Tóm tắt AI
          </Link>
          <Link
            className="rounded border border-[#dfe1e6] bg-white px-3 py-1.5 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/personalized-summary`}
          >
            Tóm tắt của tôi
          </Link>
        </div>
      </div>
    </article>
  );
}
