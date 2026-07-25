/**
 * Doi timestamp ISO thanh chuoi tuong doi ngan gon bang tieng Viet.
 * Dung cho cac o thong ke nho nen uu tien do ngan: "2h", "3 ngay".
 */
export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "—";

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) return "—";

  const diffMs = Date.now() - target.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "vừa xong";
  if (diffMinutes < 60) return `${diffMinutes}p`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng`;

  return `${Math.floor(diffMonths / 12)} năm`;
}

/** Dinh dang ngay theo chuan Viet Nam: 25/07/2026. */
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Mo ta deadline con lai: "Quá hạn 2 ngày", "Hôm nay", "Còn 5 ngày".
 * So sanh theo moc dau ngay de khong bi lech vi gio.
 */
export function describeDueDate(value: string | null | undefined) {
  if (!value) return { label: "Không có hạn", tone: "neutral" as const };

  const due = new Date(value);
  if (Number.isNaN(due.getTime())) {
    return { label: "Không có hạn", tone: "neutral" as const };
  }

  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(due) - startOfDay(new Date())) / 86400000,
  );

  if (diffDays < 0) {
    return {
      label: `Quá hạn ${Math.abs(diffDays)} ngày`,
      tone: "danger" as const,
    };
  }

  if (diffDays === 0) return { label: "Hôm nay", tone: "danger" as const };
  if (diffDays === 1) return { label: "Ngày mai", tone: "warning" as const };
  if (diffDays <= 3) return { label: `Còn ${diffDays} ngày`, tone: "warning" as const };

  return { label: `Còn ${diffDays} ngày`, tone: "neutral" as const };
}
