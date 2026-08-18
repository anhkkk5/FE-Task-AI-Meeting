"use client";

import Link from "next/link";
import { formatTime } from "@/lib/utils/relative-time";
import { Meeting } from "../types/meeting.type";
import { CalendarDays, Clock3, Video } from "lucide-react";

type MeetingCardProps = {
  meeting: Meeting;
  workspaceId: string;
  projectId: string;
  canDelete?: boolean;
  isDeleting?: boolean;
  onDelete?: (meeting: Meeting) => void;
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
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  ARCHIVED: "Đã lưu trữ",
};

const statusTones: Record<Meeting["status"], string> = {
  SCHEDULED: "border-blue-100 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-100 bg-amber-50 text-amber-700",
  COMPLETED: "border-emerald-100 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-100 bg-rose-50 text-rose-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
};

// meetingDate la ngay tran nen cat chuoi la dung. Rieng startTime/endTime la
// moc ISO UTC nen dung formatTime() de quy doi ve gio dia phuong.
function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function getMeetingEndTime(meeting: Meeting) {
  if (meeting.endTime) {
    return new Date(meeting.endTime).getTime();
  }

  return new Date(`${meeting.meetingDate}T23:59:59`).getTime();
}

function isMeetingExpired(meeting: Meeting) {
  const endTime = getMeetingEndTime(meeting);
  return Number.isFinite(endTime) && endTime < Date.now();
}

export function MeetingCard({
  meeting,
  workspaceId,
  projectId,
  canDelete,
  isDeleting,
  onDelete,
}: MeetingCardProps) {
  const expired = isMeetingExpired(meeting);
  // IN_PROGRESS van cho vao lai: nguoi bi mat mang giua buoi hop can quay lai phong.
  const canEnterRoom =
    ["SCHEDULED", "IN_PROGRESS"].includes(meeting.status) && !expired;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {typeLabels[meeting.meetingType]}
            </span>
            <span
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusTones[meeting.status]}`}
            >
              {statusLabels[meeting.status]}
            </span>
            {expired && meeting.status !== "COMPLETED" ? (
              <span className="rounded bg-[#fff4f2] px-2 py-0.5 text-xs font-semibold text-[#ae2a19]">
                Đã quá giờ
              </span>
            ) : null}
            {meeting.sprint ? (
              <span className="rounded border border-[#dfe1e6] px-2 py-0.5 text-xs font-medium text-[#44546f]">
                {meeting.sprint.name}
              </span>
            ) : null}
          </div>
          <Link
            className="text-lg font-extrabold text-slate-900 transition group-hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}`}
          >
            {meeting.title}
          </Link>
          {meeting.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
              {meeting.description}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-72 grid-cols-3 gap-2 text-left">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <CalendarDays className="mb-2 h-4 w-4 text-blue-500" />
            <p className="text-[11px] font-semibold uppercase text-[#6b778c]">
              Ngày
            </p>
            <p className="mt-1 text-xs font-semibold text-[#172b4d]">
              {formatDate(meeting.meetingDate)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <Clock3 className="mb-2 h-4 w-4 text-blue-500" />
            <p className="text-[11px] font-semibold uppercase text-[#6b778c]">
              Bắt đầu
            </p>
            <p className="mt-1 text-xs font-semibold text-[#172b4d]">
              {formatTime(meeting.startTime)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <Clock3 className="mb-2 h-4 w-4 text-slate-400" />
            <p className="text-[11px] font-semibold uppercase text-[#6b778c]">
              Kết thúc
            </p>
            <p className="mt-1 text-xs font-semibold text-[#172b4d]">
              {formatTime(meeting.endTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
        <div className="text-xs font-semibold text-slate-500">
          {meeting.participants?.length ?? 0} người tham gia
          {meeting.mongoTranscriptId
            ? " · Đã có biên bản"
            : " · Chưa có biên bản"}
          {meeting.mongoSummaryId ? " · Đã có tóm tắt" : " · Chưa có tóm tắt"}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEnterRoom ? (
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
              href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/room`}
            >
              <Video className="h-4 w-4" /> Vào phòng
            </Link>
          ) : (
            <span className="rounded bg-[#f1f2f4] px-3 py-1.5 text-sm font-semibold text-[#6b778c]">
              Không thể vào
            </span>
          )}
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/participants`}
          >
            Người tham gia
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/transcript`}
          >
            Biên bản
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/summary`}
          >
            Tóm tắt AI
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/personalized-summary`}
          >
            Tóm tắt của tôi
          </Link>
          {canDelete ? (
            <button
              className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              type="button"
              onClick={() => onDelete?.(meeting)}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
