import Link from "next/link";
import { AiPersonalizedMeetingSummary } from "../types/personalized-meeting-summary.type";

type PersonalizedSummaryListProps = {
  items: AiPersonalizedMeetingSummary[];
  workspaceId: string;
  projectId: string;
};

export function PersonalizedSummaryList({
  items,
  workspaceId,
  projectId,
}: PersonalizedSummaryListProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-zinc-950">
            Generated participant summaries
          </h2>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            Latest results returned from the all-participants generation.
          </p>
        </div>
        <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
          {items.length} summaries
        </span>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
            href={`/workspaces/${workspaceId}/projects/${projectId}/ai-reports/personalized-meeting-summaries/${item.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="break-all text-sm font-bold text-zinc-900">
                Member: {item.userId}
              </p>
              <span className="text-xs font-semibold text-zinc-500">
                {item.createdAt?.slice(0, 16).replace("T", " ") ?? "-"}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-zinc-500">
              {item.personalSummary}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
