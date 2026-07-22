import { AiMeetingSummary } from "../types/ai-report.type";
import { MeetingSummaryActionItems } from "./MeetingSummaryActionItems";

type MeetingSummaryDetailProps = {
  summary: AiMeetingSummary;
};

function RenderList({
  emptyText,
  items,
  tone = "zinc",
}: {
  emptyText: string;
  items: string[];
  tone?: "blue" | "red" | "violet" | "zinc";
}) {
  if (!items.length) {
    return <p className="text-sm font-semibold text-zinc-400">{emptyText}</p>;
  }

  const toneClass = {
    blue: "border-blue-100 bg-blue-50 text-blue-950",
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

export function MeetingSummaryDetail({ summary }: MeetingSummaryDetailProps) {
  const output = summary.aiOutput;

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                Tóm tắt cuộc họp
              </span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Đã tạo
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-950">
              {output.title || summary.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
              {output.summary || summary.summary}
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
          Nội dung tóm tắt
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-blue-950">
          {output.generatedText}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Ý chính</h2>
          <RenderList
            emptyText="Chưa tìm thấy ý chính."
            items={output.keyPoints ?? summary.keyPoints}
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Quyết định</h2>
          <RenderList
            emptyText="Chưa có quyết định nào."
            items={output.decisions ?? summary.decisions}
            tone="blue"
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Rủi ro</h2>
          <RenderList
            emptyText="Chưa phát hiện rủi ro."
            items={output.risks ?? summary.risks}
            tone="red"
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">
            Câu hỏi mở
          </h2>
          <RenderList
            emptyText="Chưa có câu hỏi mở."
            items={output.openQuestions ?? summary.openQuestions}
            tone="violet"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-zinc-950">
          Việc cần làm
        </h2>
        <MeetingSummaryActionItems
          workspaceId={summary.workspaceId}
          projectId={summary.projectId}
          summaryId={summary.id}
          items={output.actionItems ?? summary.actionItems}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-zinc-950">Bước tiếp theo</h2>
        <RenderList
          emptyText="Chưa có bước tiếp theo."
          items={output.nextSteps ?? summary.nextSteps}
          tone="blue"
        />
      </section>
    </div>
  );
}
