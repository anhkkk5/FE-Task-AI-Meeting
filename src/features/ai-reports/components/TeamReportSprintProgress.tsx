import { TeamReportMetrics } from "../types/ai-report.type";

type TeamReportSprintProgressProps = {
  metrics: TeamReportMetrics | null;
  sprintLabel: string;
  teamProgress: string;
};

/**
 * Thanh tien do sprint kem dien giai cua AI.
 *
 * Dat canh nhau vi con so mot minh khong noi len van de: nguoi doc can biet
 * "60%" nay la tot hay dang cham so voi ke hoach.
 */
export function TeamReportSprintProgress({
  metrics,
  sprintLabel,
  teamProgress,
}: TeamReportSprintProgressProps) {
  const percent = metrics?.progressPercent ?? 0;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      data-print-block="true"
      id="team-report-sprint-progress"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black text-slate-900">Tiến độ sprint</h2>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {sprintLabel}
        </span>
      </div>

      {metrics ? (
        <>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="text-3xl font-black leading-none text-brand-700">
              {percent}%
            </p>
            <p className="text-xs font-bold text-slate-500">
              {metrics.doneTasks}/{metrics.totalTasks} công việc hoàn thành
            </p>
          </div>
          <div
            aria-label={`Tiến độ sprint ${percent} phần trăm`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={percent}
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        </>
      ) : null}

      <p className="mt-4 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600">
        {teamProgress || "Chưa có dữ liệu."}
      </p>
    </section>
  );
}
