"use client";

import {
  getReviewStatusBadge,
  isFinalReviewStatus,
} from "../constants/review-status";
import { AiReportReviewStatus } from "../types/ai-report.type";

type TeamReportActionBarProps = {
  reviewStatus: AiReportReviewStatus;
  isEditing: boolean;
  isSaving: boolean;
  isApproving: boolean;
  isCancelling: boolean;
  canReview: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onApprove: () => void;
  onCancel: () => void;
  onPrint: () => void;
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
  isCancelling,
  canReview,
  onToggleEdit,
  onSave,
  onApprove,
  onCancel,
  onPrint,
}: TeamReportActionBarProps) {
  const badge = getReviewStatusBadge(reviewStatus);
  const isFinal = isFinalReviewStatus(reviewStatus);

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
        <p className="text-xs font-medium text-slate-500">{badge.hint}</p>
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

        {canReview && !isFinal ? (
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
              className="h-10 rounded-xl border border-rose-200 bg-white px-4 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              disabled={isCancelling || isEditing}
              id="team-report-cancel-button"
              title="Hủy phiên giao ban này, ví dụ khi cả đội nghỉ"
              type="button"
              onClick={onCancel}
            >
              {isCancelling ? "Đang hủy..." : "Hủy phiên"}
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
