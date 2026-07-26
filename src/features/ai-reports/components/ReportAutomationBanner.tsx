"use client";

import { ReportAutomationStatus } from "../types/ai-report.type";

type ReportAutomationBannerProps = {
  status: ReportAutomationStatus | null;
  isLoading?: boolean;
};

const weekdayNames = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

/**
 * Doi bieu thuc cron sang cau tieng Viet.
 *
 * Chi xu ly cac dang cron ma he thong dang dung (co hoac khong co truong giay).
 * Neu khong nhan dang duoc thi tra ve nguyen chuoi cron de nguoi dung con
 * thay duoc cau hinh that, tot hon la an di.
 */
function describeCron(cron: string) {
  const parts = cron.trim().split(/\s+/);
  const fields = parts.length === 6 ? parts.slice(1) : parts;

  if (fields.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  if (!/^\d+$/.test(minute) || !/^\d+$/.test(hour)) return cron;

  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  if (dayOfMonth !== "*" || month !== "*") return cron;

  if (dayOfWeek === "*") return `mỗi ngày lúc ${time}`;

  const rangeMatch = dayOfWeek.match(/^(\d)-(\d)$/);

  if (rangeMatch) {
    const from = weekdayNames[Number(rangeMatch[1])] ?? rangeMatch[1];
    const to = weekdayNames[Number(rangeMatch[2])] ?? rangeMatch[2];
    return `lúc ${time}, từ ${from} đến ${to}`;
  }

  if (/^\d$/.test(dayOfWeek)) {
    return `lúc ${time} vào ${weekdayNames[Number(dayOfWeek)] ?? dayOfWeek}`;
  }

  return cron;
}

function formatDateTime(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Bang thong bao cho biet bao cao giao ban do AI tu dong tao theo lich.
 *
 * Ly do ton tai: truoc day nguoi dung khong co cach nao biet lich tu dong co
 * chay hay khong, nen ho luon tim nut tao thu cong va tuong tinh nang chua co.
 */
export function ReportAutomationBanner({
  status,
  isLoading,
}: ReportAutomationBannerProps) {
  if (isLoading) {
    return (
      <div
        className="flex h-16 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 shadow-sm"
        id="report-automation-loading"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-xs font-semibold text-zinc-500">
          Đang kiểm tra lịch tự động...
        </span>
      </div>
    );
  }

  if (!status) return null;

  const nextRun = formatDateTime(status.nextRunAt);
  const lastRunAt = formatDateTime(status.lastRun?.finishedAt ?? null);

  if (!status.enabled) {
    return (
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm"
        id="report-automation-disabled"
      >
        <p className="text-xs font-black uppercase tracking-wider text-amber-700">
          Lịch tự động đang tắt
        </p>
        <p className="mt-1 text-sm font-medium text-amber-900">
          Báo cáo giao ban sẽ không tự sinh. Bật biến môi trường
          <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            AI_DAILY_REPORT_SCHEDULER_ENABLED
          </code>
          để AI tự tạo báo cáo mỗi ngày.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-white shadow-sm"
      id="report-automation-status"
    >
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/10">
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-indigo-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
              AI tự động
            </p>
            <p className="mt-0.5 text-sm font-bold text-zinc-900">
              Báo cáo giao ban được tạo tự động {describeCron(status.cron)}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Múi giờ {status.timeZone}. Bạn không cần bấm tạo, AI tự tổng hợp
              daily update, task và blocker của cả nhóm.
            </p>
          </div>
        </div>

        <dl className="grid shrink-0 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2">
            <dt className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Lần chạy tới
            </dt>
            <dd className="mt-0.5 text-xs font-bold text-zinc-800">
              {nextRun ?? "Chưa xác định"}
            </dd>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2">
            <dt className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Lần chạy gần nhất
            </dt>
            <dd className="mt-0.5 text-xs font-bold text-zinc-800">
              {lastRunAt ?? "Chưa chạy lần nào"}
            </dd>
            {status.lastRun ? (
              <dd className="mt-0.5 text-[11px] font-medium text-zinc-500">
                Tạo {status.lastRun.generated} · Bỏ qua{" "}
                {status.lastRun.skipped} · Lỗi {status.lastRun.failed}
              </dd>
            ) : null}
          </div>
        </dl>
      </div>
    </div>
  );
}
