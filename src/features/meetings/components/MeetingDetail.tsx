import Link from "next/link";
import { formatDateTime } from "@/lib/utils/relative-time";
import { Meeting } from "../types/meeting.type";

type MeetingDetailProps = {
  meeting: Meeting;
  workspaceId: string;
  projectId: string;
  canManage: boolean;
  canDelete?: boolean;
  isMutating?: boolean;
  onCancel: () => void;
  onComplete: () => void;
  onDelete?: () => void;
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

const statusTone: Record<Meeting["status"], string> = {
  SCHEDULED: "bg-[#e9f2ff] text-[#0c66e4]",
  IN_PROGRESS: "bg-[#fff7d6] text-[#974f0c]",
  COMPLETED: "bg-[#dcfff1] text-[#216e4e]",
  CANCELLED: "bg-[#fff4f2] text-[#ae2a19]",
  ARCHIVED: "bg-[#f1f2f4] text-[#44546f]",
};

// meetingDate la ngay tran dang "2026-07-26" (khong co gio, khong co mui gio)
// nen cat chuoi la dung. Rieng startTime/endTime la moc ISO UTC nen phai dung
// formatDateTime() de quy doi ve gio dia phuong.
function formatDate(value: string) {
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
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

export function MeetingDetail({
  meeting,
  workspaceId,
  projectId,
  canManage,
  canDelete,
  isMutating,
  onCancel,
  onComplete,
  onDelete,
}: MeetingDetailProps) {
  const expired = isMeetingExpired(meeting);
  // IN_PROGRESS van cho vao lai: nguoi bi mat mang giua buoi hop can quay lai phong.
  const canEnterRoom =
    ["SCHEDULED", "IN_PROGRESS"].includes(meeting.status) && !expired;
  const canChangeStatus =
    canManage && !["CANCELLED", "ARCHIVED", "COMPLETED"].includes(meeting.status);
  // Chot khi chua co bien ban thi AI khong co gi de tom tat, canh bao truoc.
  const completeWarning = !meeting.mongoTranscriptId
    ? "Cuộc họp chưa có biên bản nên AI sẽ không tạo được tóm tắt. Bạn vẫn muốn kết thúc?"
    : null;
  const handleComplete = () => {
    if (completeWarning && !window.confirm(completeWarning)) {
      return;
    }

    onComplete();
  };

  return (
    <section className="rounded border border-[#dfe1e6] bg-white">
      <div className="flex flex-col gap-5 border-b border-[#dfe1e6] px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#e9f2ff] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#0c66e4]">
              {typeLabels[meeting.meetingType]}
            </span>
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${statusTone[meeting.status]}`}
            >
              {statusLabels[meeting.status]}
            </span>
            {expired && meeting.status !== "COMPLETED" ? (
              <span className="rounded bg-[#fff4f2] px-2 py-1 text-xs font-semibold text-[#ae2a19]">
                Đã quá giờ
              </span>
            ) : null}
            {meeting.autoCompleted ? (
              <span className="rounded bg-[#f1f2f4] px-2 py-1 text-xs font-semibold text-[#44546f]">
                Tự động kết thúc
              </span>
            ) : null}
            {meeting.sprint ? (
              <span className="rounded bg-[#f1f2f4] px-2 py-1 text-xs font-semibold text-[#44546f]">
                {meeting.sprint.name}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 truncate text-2xl font-semibold text-[#172b4d]">
            {meeting.title}
          </h1>
          {meeting.description ? (
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#44546f]">
              {meeting.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {canEnterRoom ? (
            <Link
              className="h-9 rounded bg-[#172b4d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0c1f3f]"
              href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/room`}
            >
              Vào phòng họp
            </Link>
          ) : (
            <span className="h-9 rounded bg-[#f1f2f4] px-3 py-2 text-sm font-semibold text-[#6b778c]">
              Không thể vào phòng
            </span>
          )}
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
                id="meeting-complete-button"
                onClick={handleComplete}
                type="button"
              >
                Kết thúc cuộc họp
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
          {canDelete ? (
            <button
              className="h-9 rounded border border-[#ffbdad] bg-white px-3 text-sm font-semibold text-[#ae2a19] hover:bg-[#fff4f2] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isMutating}
              onClick={onDelete}
              type="button"
            >
              Xóa
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-px bg-[#dfe1e6] md:grid-cols-5">
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Ngày họp
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDate(meeting.meetingDate)}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Bắt đầu
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDateTime(meeting.startTime)}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Kết thúc
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDateTime(meeting.endTime)}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Biên bản
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {meeting.mongoTranscriptId ? "Đã có" : "Chưa có"}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Tóm tắt AI
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {meeting.mongoSummaryId ? "Đã có" : "Chưa có"}
          </p>
        </div>
      </div>
    </section>
  );
}
