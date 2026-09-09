import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarDays, RotateCcw } from "lucide-react";
import { DailyUpdate } from "../types/daily-update.type";

type DailyUpdateCardProps = {
  dailyUpdate: DailyUpdate;
  workspaceId: string;
  projectId: string;
  onRestore?: (dailyUpdate: DailyUpdate) => void;
  isRestoring?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

export function DailyUpdateCard({
  dailyUpdate,
  workspaceId,
  projectId,
  onRestore,
  isRestoring = false,
}: DailyUpdateCardProps) {
  const blockerItems = dailyUpdate.blockers
    ?.split(/\r?\n/u)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {dailyUpdate.user?.fullName?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {dailyUpdate.user?.fullName ?? "Thành viên"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {dailyUpdate.user?.email ?? dailyUpdate.userId}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <CalendarDays className="h-3 w-3" />
                {formatDate(dailyUpdate.updateDate)}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                {dailyUpdate.sprint?.name ?? "Không gắn sprint"}
              </span>
              {dailyUpdate.submissionStatus === "PENDING_REVIEW" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  Bản nháp AI · Chờ duyệt
                </span>
              ) : dailyUpdate.generatedByAi ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  AI tự động gửi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Đã gửi
                </span>
              )}
            </div>
          </div>
        </div>

        {onRestore ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
            disabled={isRestoring}
            onClick={() => onRestore(dailyUpdate)}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isRestoring ? "Đang khôi phục..." : "Khôi phục"}
          </button>
        ) : (
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            href={`/workspaces/${workspaceId}/projects/${projectId}/daily-updates/${dailyUpdate.id}`}
          >
            Chi tiết <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Hôm qua
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
            {dailyUpdate.yesterdayWork}
          </p>
        </section>
        <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Hôm nay
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
            {dailyUpdate.todayPlan}
          </p>
        </section>
      </div>

      {dailyUpdate.blockers ? (
        <section className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-amber-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            Trở ngại cần xử lý
          </h3>
          <ul className="mt-3 space-y-2 pl-9">
            {blockerItems.map((item, index) => (
              <li className="flex gap-2 text-sm leading-6 text-amber-950" key={`${item}-${index}`}>
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-amber-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
