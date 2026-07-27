import { AiReportReviewStatus } from "../types/ai-report.type";

export type ReviewStatusBadge = {
  label: string;
  hint: string;
  className: string;
};

/**
 * Nhãn cho từng bước của phiên giao ban.
 *
 * Để ở một chỗ dùng chung vì cả thẻ danh sách và thanh hành động đều hiển thị
 * trạng thái này; tách đôi thì sớm muộn hai chỗ sẽ ghi khác nhau.
 *
 * Giữ cả `APPROVED` vì dữ liệu tạo trước khi mở rộng trạng thái vẫn còn giá trị
 * này; backend đọc ra là PUBLISHED nhưng để đây cho chắc, tránh vỡ giao diện.
 */
export const reviewStatusBadge: Record<
  AiReportReviewStatus,
  ReviewStatusBadge
> = {
  DRAFT: {
    label: "Mới tạo",
    hint: "Phiên vừa được tạo, chưa bắt đầu thu thập báo cáo cá nhân.",
    className: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
  },
  COLLECTING: {
    label: "Đang thu thập",
    hint: "Đang chờ thành viên gửi báo cáo cá nhân của họ.",
    className: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  },
  AI_GENERATING: {
    label: "AI đang tổng hợp",
    hint: "AI đang đọc dữ liệu để tổng hợp báo cáo nhóm.",
    className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  },
  PENDING_REVIEW: {
    label: "Chờ duyệt",
    hint: "Xem lại nội dung AI tổng hợp rồi duyệt để gửi cho cả nhóm.",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  PUBLISHED: {
    label: "Đã phát hành",
    hint: "Báo cáo đã chốt và hiển thị cho cả nhóm.",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    hint: "Phiên này đã hủy, không tính vào lịch sử giao ban.",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
  APPROVED: {
    label: "Đã phát hành",
    hint: "Báo cáo đã chốt và hiển thị cho cả nhóm.",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
};

/** Nhãn an toàn cho cả giá trị lạ đến từ dữ liệu cũ. */
export function getReviewStatusBadge(
  status: AiReportReviewStatus | null | undefined,
) {
  if (!status) return reviewStatusBadge.PENDING_REVIEW;

  return reviewStatusBadge[status] ?? reviewStatusBadge.PENDING_REVIEW;
}

/** Trạng thái đã chốt: không còn sửa hay duyệt được nữa. */
export function isFinalReviewStatus(status: AiReportReviewStatus) {
  return (
    status === "PUBLISHED" || status === "APPROVED" || status === "CANCELLED"
  );
}
