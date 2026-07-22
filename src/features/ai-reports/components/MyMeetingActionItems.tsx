import Link from "next/link";
import { MyMeetingActionItem } from "../types/personalized-meeting-summary.type";

type MyMeetingActionItemsProps = {
  items: MyMeetingActionItem[];
  workspaceId: string;
  projectId: string;
};

export function MyMeetingActionItems({
  items,
  workspaceId,
  projectId,
}: MyMeetingActionItemsProps) {
  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm font-bold text-zinc-700">
          No meeting action items found.
        </p>
        <p className="mt-2 text-xs font-medium text-zinc-500">
          Generate a personalized meeting summary first, then action items will
          appear here.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <article
          key={`${item.summaryId}-${item.title}-${index}`}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                  {item.meetingDate ?? "No date"}
                </span>
                <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  {item.deadline ?? "No deadline"}
                </span>
              </div>
              <h2 className="text-base font-black text-zinc-950">
                {item.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-zinc-500">
                {item.meetingTitle ?? "Meeting"}
              </p>
              {item.source ? (
                <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-600">
                  Source: {item.source}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${workspaceId}/projects/${projectId}/meetings/${item.meetingId}`}
              >
                Meeting
              </Link>
              <Link
                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                href={`/workspaces/${workspaceId}/projects/${projectId}/ai-reports/personalized-meeting-summaries/${item.summaryId}`}
              >
                Summary
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
