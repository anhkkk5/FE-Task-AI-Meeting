import { HandoverStatus } from "../types/shift-handover.type";

/**
 * Nhan trang thai ban giao.
 *
 * Tach thanh component rieng vi trang danh sach, the tom tat va trang chi tiet
 * task deu can hien cung mot trang thai; de o mot cho thi doi mau chi phai sua
 * mot lan.
 */
const statusMeta: Record<
  HandoverStatus,
  { label: string; className: string; description: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
    description: "Chưa gửi cho người nhận",
  },
  PENDING: {
    label: "Chờ người nhận",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    description: "Đang chờ người nhận phản hồi",
  },
  CHANGES_REQUESTED: {
    label: "Cần bổ sung",
    className: "border-orange-200 bg-orange-50 text-orange-800",
    description: "Người nhận yêu cầu bổ sung thông tin",
  },
  ACKNOWLEDGED: {
    label: "Đã tiếp nhận",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description: "Người nhận đã nhận việc",
  },
  REJECTED: {
    label: "Đã từ chối",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    description: "Người nhận từ chối tiếp nhận",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "border-zinc-200 bg-zinc-50 text-zinc-500",
    description: "Bàn giao đã bị hủy",
  },
};

export function getHandoverStatusLabel(status: HandoverStatus) {
  return statusMeta[status].label;
}

export function HandoverStatusBadge({ status }: { status: HandoverStatus }) {
  const meta = statusMeta[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}
