import { AiPersonalReport } from "../types/ai-report.type";

type PersonalReportDetailProps = {
  report: AiPersonalReport;
};

function RenderList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return <p className="text-sm font-medium text-zinc-400">Khong co du lieu.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PersonalReportDetail({ report }: PersonalReportDetailProps) {
  const output = report.aiOutput;

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                {report.reportType}
              </span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {report.status}
              </span>
              {report.model ? (
                <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  {report.model}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-black text-zinc-950">
              {output.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
              {output.summary}
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Report date
              </p>
              <p className="font-bold text-zinc-900">{report.reportDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                User
              </p>
              <p className="break-all font-bold text-zinc-900">
                {report.userId}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Sprint
              </p>
              <p className="break-all font-bold text-zinc-900">
                {report.sprintId ?? "All project tasks"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
          AI generated report
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-blue-950">
          {output.generatedText}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">
            Viec da hoan thanh
          </h2>
          <RenderList items={output.completedTasks} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">
            Viec dang xu ly
          </h2>
          <RenderList items={output.inProgressTasks} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Blockers</h2>
          <RenderList items={output.blockers} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Rui ro</h2>
          <RenderList items={output.risks} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-zinc-950">
          Goi y hanh dong
        </h2>
        <RenderList items={output.recommendations} />
      </section>

      {report.inputData ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-zinc-950">
            Du lieu da dua vao prompt
          </h2>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            Chi gom du lieu nghiep vu da sanitize, khong chua password, token
            hoac secret.
          </p>
          <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
            {JSON.stringify(report.inputData, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
