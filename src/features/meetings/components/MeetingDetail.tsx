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
  SPRINT_PLANNING: "Lập kế hoạch sprint",
  DAILY_SCRUM: "Họp daily",
  SPRINT_REVIEW: "Tổng kết sprint",
  RETROSPECTIVE: "Cải tiến sprint",
  GENERAL: "Tổng quan",
};

const statusLabels: Record<Meeting["status"], string> = {
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  ARCHIVED: "Đã lưu trữ",
};

const statusTone: Record<Meeting["status"], string> = {
  SCHEDULED: "bg-[#e9f2ff] text-[#0c66e4]",
  COMPLETED: "bg-[#dcfff1] text-[#216e4e]",
  CANCELLED: "bg-[#fff4f2] text-[#ae2a19]",
  ARCHIVED: "bg-[#f1f2f4] text-[#44546f]",
};

function formatDateTime(value: string | null) {
  if (!value) return "Chưa đặt";

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
    <section className="rounded border border-[#dfe1e6] bg-white">
      <div className="flex flex-col gap-5 border-b border-[#dfe1e6] px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#e9f2ff] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#0c66e4]">
              {typeLabels[meeting.meetingType]}
            </span>
            <span className={`rounded px-2 py-1 text-xs font-semibold ${statusTone[meeting.status]}`}>
              {statusLabels[meeting.status]}
            </span>
            {meeting.sprint ? (
              <span className="rounded bg-[#f1f2f4] px-2 py-1 text-xs font-semibold text-[#44546f]">
                {meeting.sprint.name}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 truncate text-2xl font-semibold text-[#172b4d]">{meeting.title}</h1>
          {meeting.description ? (
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#44546f]">
              {meeting.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="h-9 rounded bg-[#172b4d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0c1f3f]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/room`}
          >
            Vào phòng họp
          </Link>
          <Link
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 py-2 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/participants`}
          >
            Người tham gia
          </Link>
          <Link
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 py-2 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/transcript`}
          >
            Biên bản
          </Link>
          <Link
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 py-2 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/summary`}
          >
            Tóm tắt AI
          </Link>
          <Link
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 py-2 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/personalized-summary`}
          >
            Tóm tắt của tôi
          </Link>
          {canChangeStatus ? (
            <>
              <button
                className="h-9 rounded bg-[#00875a] px-3 text-sm font-semibold text-white hover:bg-[#216e4e] disabled:bg-[#b3b9c4]"
                disabled={isMutating}
                onClick={onComplete}
                type="button"
              >
                Hoàn thành
              </button>
              <button
                className="h-9 rounded bg-[#de350b] px-3 text-sm font-semibold text-white hover:bg-[#ae2a19] disabled:bg-[#b3b9c4]"
                disabled={isMutating}
                onClick={onCancel}
                type="button"
              >
                Hủy
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-px bg-[#dfe1e6] md:grid-cols-5">
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">Ngày họp</p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">{meeting.meetingDate}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">Bắt đầu</p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDateTime(meeting.startTime)}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">Kết thúc</p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDateTime(meeting.endTime)}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">Biên bản</p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {meeting.mongoTranscriptId ? "Đã có" : "Chưa có"}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">Tóm tắt AI</p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {meeting.mongoSummaryId ? "Đã có" : "Chưa có"}
          </p>
        </div>
      </div>
    </section>
  );
}
