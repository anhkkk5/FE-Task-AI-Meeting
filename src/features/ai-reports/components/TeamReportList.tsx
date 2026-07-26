import { AiTeamReport } from "../types/ai-report.type";
import { TeamReportCard } from "./TeamReportCard";

type TeamReportListProps = {
  items: AiTeamReport[];
  workspaceId: string;
  projectId: string;
  emptyText?: string;
};

export function TeamReportList({
  items,
  workspaceId,
  projectId,
  emptyText = "Chưa có báo cáo nhóm nào trong bộ lọc hiện tại.",
}: TeamReportListProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-bold text-zinc-700">{emptyText}</p>
        <p className="mt-2 text-xs font-medium text-zinc-500">
          AI sẽ tự tổng hợp tình hình nhóm từ cập nhật hằng ngày, task và
          sprint.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((report) => (
        <TeamReportCard
          key={report.id}
          projectId={projectId}
          report={report}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
