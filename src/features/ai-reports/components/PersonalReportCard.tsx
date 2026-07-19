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
  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
              {report.reportType}
            </span>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              {report.status}
            </span>
          </div>
          <Link
            className="text-lg font-black text-zinc-950 transition hover:text-blue-600"
            href={`/workspaces/${workspaceId}/projects/${projectId}/ai-reports/personal/${report.id}`}
          >
            {report.aiOutput?.title ?? "Báo cáo cá nhân"}
          </Link>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-500">
            {report.summary ?? report.aiOutput?.summary ?? "Chưa có tóm tắt."}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Ngày báo cáo
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-800">
            {report.reportDate}
          </p>
          <p className="mt-2 text-[10px] font-semibold text-zinc-400">
            Thành viên: {report.userId}
          </p>
        </div>
      </div>
    </article>
  );
}
