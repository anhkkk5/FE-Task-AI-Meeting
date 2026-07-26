"use client";

import { AiReportReviewStatus } from "../types/ai-report.type";

type TeamReportActionBarProps = {
  reviewStatus: AiReportReviewStatus;
  isEditing: boolean;
  isSaving: boolean;
  isApproving: boolean;
  canReview: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onApprove: () => void;
  onPrint: () => void;
};

const reviewBadge: Record<
  AiReportReviewStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Bản nháp chờ duyệt",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  APPROVED: {
    label: "Đã duyệt",
    className: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  },
};

/**
 * Thanh hành động của báo cáo giao ban.
 *
 * Tách khỏi phần nội dung để cả thanh này biến mất khi in: bản PDF chỉ nên có
 * báo cáo, không có nút bấm.
 */
export function TeamReportActionBar({
  reviewStatus,
  isEditing,
  isSaving,
  isApproving,
  canReview,
  onToggleEdit,
  onSave,
  onApprove,
  onPrint,
}: TeamReportActionBarProps) {
  const badge = reviewBadge[reviewStatus];
  const isApproved = reviewStatus === "APPROVED";

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      data-print-hidden="true"
      id="team-report-action-bar"
    >
      <div className="flex items-center gap-3">
        <span
          className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${badge.className}`}
          id="team-report-review-status"
        >
          {badge.label}
        </span>
        <p className="text-xs font-medium text-slate-500">
          {isApproved
            ? "Báo cáo đã chốt, cả nhóm đã nhận email thông báo."
            : "Xem lại nội dung AI tổng hợp rồi duyệt để gửi cho cả nhóm."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          id="team-report-print-button"
          type="button"
          onClick={onPrint}
        >
          Xuất PDF
        </button>

        {canReview && !isApproved ? (
          <>
            {isEditing ? (
              <button
                className="h-10 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                disabled={isSaving}
                id="team-report-save-button"
                type="button"
                onClick={onSave}
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            ) : null}

            <button
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              id="team-report-edit-button"
              type="button"
              onClick={onToggleEdit}
            >
              {isEditing ? "Hủy sửa" : "Sửa nội dung"}
            </button>

            <button
              className="h-10 rounded-xl bg-brand-700 px-4 text-xs font-bold text-white shadow-sm shadow-brand-700/20 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              disabled={isApproving || isEditing}
              id="team-report-approve-button"
              title={
                isEditing
                  ? "Lưu hoặc hủy thay đổi trước khi duyệt"
                  : "Duyệt và gửi báo cáo cho cả nhóm"
              }
              type="button"
              onClick={onApprove}
            >
              {isApproving ? "Đang duyệt..." : "Duyệt & gửi cho nhóm"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
