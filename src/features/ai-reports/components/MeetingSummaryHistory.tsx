import Link from "next/link";
import { AiMeetingSummary } from "../types/ai-report.type";

type MeetingSummaryHistoryProps = {
  items: AiMeetingSummary[];
  workspaceId: string;
  projectId: string;
  currentSummaryId?: string;
};

export function MeetingSummaryHistory({
  items,
  workspaceId,
  projectId,
  currentSummaryId,
}: MeetingSummaryHistoryProps) {
  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm font-bold text-zinc-700">
          No meeting summary has been generated yet.
        </p>
        <p className="mt-2 text-xs font-medium text-zinc-500">
          Add a transcript first, then generate an AI summary for this meeting.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-zinc-950">Summary history</h2>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            Latest generated versions for this meeting.
          </p>
        </div>
        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
          {items.length} versions
        </span>
      </div>
      <div className="grid gap-2">
        {items.map((item) => {
          const isCurrent = item.id === currentSummaryId;

          return (
            <Link
              key={item.id}
              className={`rounded-xl border px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50 ${
                isCurrent
                  ? "border-blue-200 bg-blue-50"
                  : "border-zinc-200 bg-zinc-50"
              }`}
              href={`/workspaces/${workspaceId}/projects/${projectId}/ai-reports/meeting-summaries/${item.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-zinc-900">
                  {item.title || "Meeting summary"}
                </p>
                <span className="text-xs font-semibold text-zinc-500">
                  {item.createdAt?.slice(0, 16).replace("T", " ") ?? "-"}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-zinc-500">
                {item.summary}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
