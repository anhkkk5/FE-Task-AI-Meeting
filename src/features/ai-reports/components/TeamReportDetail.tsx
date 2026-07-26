import { AiTeamReport } from "../types/ai-report.type";

type TeamReportDetailProps = {
  report: AiTeamReport;
};

function RenderList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return <p className="text-sm font-medium text-zinc-400">Không có dữ liệu.</p>;
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

export function TeamReportDetail({ report }: TeamReportDetailProps) {
  const output = report.aiOutput;

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                {report.reportType}
              </span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {report.status}
              </span>
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
                Ngày báo cáo
              </p>
              <p className="font-bold text-zinc-900">{report.reportDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Sprint
              </p>
              <p className="break-all font-bold text-zinc-900">
                {report.sprintId ?? "Toàn dự án"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Người tạo
              </p>
              <p className="break-all font-bold text-zinc-900">
                {report.createdBy}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">
          Nội dung báo cáo
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-indigo-950">
          {output.generatedText}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-black text-zinc-950">
          Tiến độ nhóm
        </h2>
        <p className="text-sm font-medium leading-relaxed text-zinc-700">
          {output.teamProgress}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">
            Việc đã hoàn thành
          </h2>
          <RenderList items={output.completedWork} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">
            Trọng tâm hôm nay
          </h2>
          <RenderList items={output.todayFocus} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Blockers</h2>
          <RenderList items={output.blockers} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">Rủi ro</h2>
          <RenderList items={output.risks} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-zinc-950">
          Thành viên chưa gửi cập nhật hằng ngày
        </h2>
        <RenderList items={output.missingDailyUpdates} />
      </section>

      {output.handoverSummary?.trim() ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-zinc-950">
            Bàn giao công việc
          </h2>
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-600">
            {output.handoverSummary}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-zinc-950">
          Tóm tắt theo thành viên
        </h2>
        {output.memberSummaries?.length ? (
          <div className="grid gap-3">
            {output.memberSummaries.map((member) => (
              <article
                key={member.userId}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <h3 className="text-sm font-black text-zinc-950">
                  {member.fullName}
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                  {member.summary}
                </p>
                {member.blockers.length ? (
                  <p className="mt-2 text-xs font-bold text-amber-700">
                    Blocker: {member.blockers.join("; ")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-zinc-400">Không có dữ liệu.</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-zinc-950">
          Gợi ý hành động
        </h2>
        <RenderList items={output.recommendations} />
      </section>

    </div>
  );
}
