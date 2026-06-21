import { SprintStatus } from "../types/sprint.type";

type SprintStatusBadgeProps = {
  status: SprintStatus;
};

const statusStyles: Record<SprintStatus, string> = {
  PLANNED: "border-sky-100 bg-sky-50 text-sky-700",
  ACTIVE: "border-emerald-100 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-indigo-100 bg-indigo-50 text-indigo-700",
  CANCELLED: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function SprintStatusBadge({ status }: SprintStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
