import { AiPersonalReport } from "../types/ai-report.type";
import { PersonalReportCard } from "./PersonalReportCard";

type PersonalReportListProps = {
  items: AiPersonalReport[];
  workspaceId: string;
  projectId: string;
  emptyText?: string;
};

export function PersonalReportList({
  items,
  workspaceId,
  projectId,
  emptyText = "Chưa có báo cáo AI nào trong bộ lọc hiện tại.",
}: PersonalReportListProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-700">{emptyText}</p>
        <p className="mt-2 text-xs font-medium text-slate-500">
          AI sẽ tự tổng hợp báo cáo cá nhân từ cập nhật hằng ngày và task trong
          dự án.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((report) => (
        <PersonalReportCard
          key={report.id}
          projectId={projectId}
          report={report}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
