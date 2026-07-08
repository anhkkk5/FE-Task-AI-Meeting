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
  emptyText = "Chua co AI report nao trong bo loc hien tai.",
}: PersonalReportListProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-bold text-zinc-700">{emptyText}</p>
        <p className="mt-2 text-xs font-medium text-zinc-500">
          Hay tao report tu Daily Update va task trong project de AI tong hop
          thanh bao cao ca nhan.
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
