import Link from "next/link";
import { getReviewStatusBadge } from "../constants/review-status";
import { AiTeamReport } from "../types/ai-report.type";

type TeamReportCardProps = {
  report: AiTeamReport;
  workspaceId: string;
  projectId: string;
};

export function TeamReportCard({
  report,
  workspaceId,
  projectId,
}: TeamReportCardProps) {
  const badge = report.reviewStatus
    ? getReviewStatusBadge(report.reviewStatus)
    : null;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {badge ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${badge.className}`}
                title={badge.hint}
              >
                {badge.label}
              </span>
            </div>
          ) : null}
          <Link
            className="text-lg font-black text-slate-900 transition hover:text-brand-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/ai-reports/team/${report.id}`}
          >
            {report.aiOutput?.title ?? "Báo cáo đội nhóm"}
          </Link>
          <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-slate-600">
            {report.summary ?? report.aiOutput?.summary ?? "Chưa có tóm tắt."}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Ngày báo cáo
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {report.reportDate}
          </p>
          <p className="mt-2 text-[10px] font-semibold text-slate-400">
            Sprint: {report.sprintId ?? "Toàn dự án"}
          </p>
        </div>
      </div>
    </article>
  );
}
