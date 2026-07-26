import { AiPersonalReport } from "../types/ai-report.type";

type PersonalReportDetailProps = {
  report: AiPersonalReport;
};

function RenderList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return <p className="text-sm font-medium text-slate-400">Không có dữ liệu.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PersonalReportDetail({ report }: PersonalReportDetailProps) {
  const output = report.aiOutput;
  const memberName =
    (report.inputData as { user?: { fullName?: string; email?: string } })?.user
      ?.fullName ||
    (report.inputData as { user?: { fullName?: string; email?: string } })?.user
      ?.email ||
    report.userId;

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
              Báo cáo cá nhân
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">
              {output.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">
              {output.summary}
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Ngày báo cáo
              </p>
              <p className="font-bold text-slate-900">{report.reportDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Thành viên
              </p>
              <p className="break-all font-bold text-brand-700">{memberName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Sprint
              </p>
              <p className="break-all font-bold text-slate-900">
                {report.sprintId ?? "Toàn dự án"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
          Nội dung báo cáo
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-800">
          {output.generatedText}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-slate-900">
            Việc đã hoàn thành
          </h2>
          <RenderList items={output.completedTasks} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-slate-900">
            Việc đang xử lý
          </h2>
          <RenderList items={output.inProgressTasks} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-slate-900">Vướng mắc</h2>
          <RenderList items={output.blockers} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-slate-900">Rủi ro</h2>
          <RenderList items={output.risks} />
        </div>
      </section>

      {output.handoverSummary?.trim() ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-slate-900">
            Bàn giao công việc
          </h2>
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600">
            {output.handoverSummary}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-slate-900">
          Đề xuất hành động
        </h2>
        <RenderList items={output.recommendations} />
      </section>
    </div>
  );
}
