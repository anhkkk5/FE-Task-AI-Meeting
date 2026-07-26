import Link from "next/link";
import { AiPersonalReport } from "../types/ai-report.type";

type PersonalReportCardProps = {
  report: AiPersonalReport;
  workspaceId: string;
  projectId: string;
};

export function PersonalReportCard({
  report,
  workspaceId,
  projectId,
}: PersonalReportCardProps) {
  const memberName =
    (report.inputData as { user?: { fullName?: string; email?: string } })?.user
      ?.fullName ||
    (report.inputData as { user?: { fullName?: string; email?: string } })?.user
      ?.email;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link
            className="text-base font-bold text-slate-900 transition hover:text-brand-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/ai-reports/personal/${report.id}`}
          >
            {report.aiOutput?.title ?? "Báo cáo cá nhân"}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-xs font-normal leading-relaxed text-slate-500">
            {report.summary ?? report.aiOutput?.summary ?? "Chưa có tóm tắt."}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-slate-50/80 px-3.5 py-2.5 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Ngày báo cáo
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {report.reportDate}
          </p>
          {memberName ? (
            <p className="mt-2 text-[11px] font-bold text-brand-700">
              Thành viên: {memberName}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
