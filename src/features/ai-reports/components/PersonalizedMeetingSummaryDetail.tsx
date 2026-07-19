import Link from "next/link";
import {
  AiPersonalizedMeetingSummary,
  PersonalizedMeetingActionItem,
} from "../types/personalized-meeting-summary.type";

type PersonalizedMeetingSummaryDetailProps = {
  summary: AiPersonalizedMeetingSummary;
  workspaceId?: string;
  projectId?: string;
};

function RenderList({
  emptyText,
  items,
  tone = "zinc",
}: {
  emptyText: string;
  items: string[];
  tone?: "blue" | "emerald" | "red" | "violet" | "zinc";
}) {
  if (!items.length) {
    return <p className="text-sm font-semibold text-zinc-400">{emptyText}</p>;
  }

  const toneClass = {
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-950",
    red: "border-red-100 bg-red-50 text-red-950",
    violet: "border-violet-100 bg-violet-50 text-violet-950",
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-700",
  }[tone];

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={`rounded-xl border px-3 py-2 text-sm font-medium ${toneClass}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ActionItems({ items }: { items: PersonalizedMeetingActionItem[] }) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm font-semibold text-zinc-500">
        Chưa có việc cần làm trực tiếp cho thành viên này.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <article
          key={`${item.title}-${index}`}
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-zinc-950">{item.title}</p>
              {item.source ? (
                <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500">
                  Nguồn: {item.source}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                {item.assigneeName ?? "Chưa gán"}
              </span>
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                {item.deadline ?? "Chưa có hạn"}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PersonalizedMeetingSummaryDetail({
  summary,
  workspaceId,
  projectId,
}: PersonalizedMeetingSummaryDetailProps) {
  const output = summary.aiOutput;
  const activeWorkspaceId = workspaceId ?? summary.workspaceId;
  const activeProjectId = projectId ?? summary.projectId;

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                Tóm tắt cá nhân
              </span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Đã tạo
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-950">
              {output.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
              {output.personalSummary || summary.personalSummary}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Thời điểm tạo
            </p>
            <p className="mt-1 font-bold text-zinc-900">
              {summary.createdAt?.slice(0, 16).replace("T", " ") ?? "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
          Góc nhìn cá nhân
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-blue-950">
          {output.generatedText}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black text-zinc-950">
            Việc của tôi
          </h2>
          <Link
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            href={`/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/my-meeting-action-items`}
          >
            Xem tất cả việc của tôi
          </Link>
        </div>
        <ActionItems items={output.myActionItems ?? []} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">
            Quyết định liên quan
          </h2>
          <RenderList
            emptyText="Chưa có quyết định liên quan."
            items={output.relevantDecisions ?? []}
            tone="blue"
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Nhắc đến</h2>
          <RenderList
            emptyText="Chưa có đoạn nội dung nhắc trực tiếp."
            items={output.mentions ?? []}
            tone="emerald"
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Rủi ro</h2>
          <RenderList
            emptyText="Chưa có rủi ro trực tiếp."
            items={output.risks ?? []}
            tone="red"
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Bước tiếp theo</h2>
          <RenderList
            emptyText="Chưa có bước tiếp theo."
            items={output.nextSteps ?? []}
            tone="violet"
          />
        </div>
      </section>
    </div>
  );
}
