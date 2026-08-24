import Link from "next/link";
import { confirmAction, showAppNotice } from "@/components/feedback/AppDialogProvider";
import { formatDateTime } from "@/lib/utils/relative-time";
import { Meeting } from "../types/meeting.type";
import { Bot, CalendarDays, CheckCircle2, Clock3, FileDown, FileText, Sparkles, Users, Video } from "lucide-react";

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
  SCHEDULED: "border-blue-100 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-100 bg-amber-50 text-amber-700",
  COMPLETED: "border-emerald-100 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-100 bg-rose-50 text-rose-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
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

export function exportMeetingMinutesToPDF(meeting: Meeting) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showAppNotice({ title: "Không thể mở bản in", description: "Vui lòng cho phép cửa sổ bật lên để in file PDF.", tone: "warning" });
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Biên bản cuộc họp - ${meeting.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #0f172a; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
        .brand { font-size: 20px; font-weight: 800; color: #2563eb; }
        .title { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 10px; }
        .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-top: 20px; }
        .box-title { font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 8px; tracking-wider: 1px; }
        .content { font-size: 13px; line-height: 1.6; color: #334155; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">✨ AgileFlow AI — Biên bản Cuộc họp</div>
          <div class="title">${meeting.title}</div>
          <div class="meta">Ngày họp: ${meeting.meetingDate} · Trạng thái: ${meeting.status} · Loại: ${typeLabels[meeting.meetingType] || "General"}</div>
        </div>
      </div>

      <div class="box">
        <div class="box-title">Tóm tắt Biên bản & Nội dung AI Ghi nhận</div>
        <div class="content">
          ${meeting.description || "Biên bản cuộc họp được ghi nhận và tổng hợp tự động bởi Trợ lý AI AgileFlow."}
        </div>
      </div>

      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
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
  const handleComplete = async () => {
    if (completeWarning && !await confirmAction({ title: "Kết thúc cuộc họp", description: completeWarning, confirmLabel: "Vẫn kết thúc", tone: "warning" })) {
      return;
    }

    onComplete();
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex flex-col gap-6 border-b border-slate-100 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {typeLabels[meeting.meetingType]}
            </span>
            <span
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusTone[meeting.status]}`}
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

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {meeting.title}
          </h1>
          {meeting.description ? (
            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm font-medium leading-6 text-slate-500">
              {meeting.description}
            </p>
          ) : null}
        </div>

        <div className="flex max-w-xl flex-wrap justify-start gap-2 lg:justify-end">
          {canEnterRoom ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/room`}
            >
              <Video className="h-4 w-4" /> Vào phòng họp
            </Link>
          ) : (
            <span className="h-9 rounded bg-[#f1f2f4] px-3 py-2 text-sm font-semibold text-[#6b778c]">
              Không thể vào phòng
            </span>
          )}
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/participants`}
          >
            <Users className="h-4 w-4" /> Người tham gia
          </Link>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/transcript`}
          >
            <FileText className="h-4 w-4" /> Biên bản
          </Link>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/summary`}
          >
            <Sparkles className="h-4 w-4" /> Tóm tắt AI
          </Link>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${meeting.id}/personalized-summary`}
          >
            <Bot className="h-4 w-4" /> Tóm tắt của tôi
          </Link>
          <button
            type="button"
            onClick={() => exportMeetingMinutesToPDF(meeting)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            title="In & Xuất biên bản cuộc họp ra file PDF"
          >
            <FileDown className="h-4 w-4" /> Xuất biên bản PDF
          </button>
          {canChangeStatus ? (
            <>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                disabled={isMutating}
                id="meeting-complete-button"
                onClick={handleComplete}
                type="button"
              >
                <CheckCircle2 className="h-4 w-4" /> Kết thúc cuộc họp
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

      <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <CalendarDays className="mb-3 h-5 w-5 text-blue-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Ngày họp
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDate(meeting.meetingDate)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <Clock3 className="mb-3 h-5 w-5 text-blue-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Bắt đầu
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDateTime(meeting.startTime)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <Clock3 className="mb-3 h-5 w-5 text-sky-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Kết thúc
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {formatDateTime(meeting.endTime)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <FileText className="mb-3 h-5 w-5 text-emerald-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Biên bản
          </p>
          <p className="mt-2 text-sm font-semibold text-[#172b4d]">
            {meeting.mongoTranscriptId ? "Đã có" : "Chưa có"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <Sparkles className="mb-3 h-5 w-5 text-violet-600" />
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
