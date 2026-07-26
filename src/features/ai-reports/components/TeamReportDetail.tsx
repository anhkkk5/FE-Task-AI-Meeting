import { AiTeamReport } from "../types/ai-report.type";
import { TeamReportDraft, TeamReportEditor } from "./TeamReportEditor";
import { TeamReportMemberResults } from "./TeamReportMemberResults";
import { TeamReportMetricCards } from "./TeamReportMetricCards";
import { TeamReportSprintProgress } from "./TeamReportSprintProgress";

type TeamReportDetailProps = {
  report: AiTeamReport;
  isEditing: boolean;
  draft: TeamReportDraft;
  onDraftChange: (draft: TeamReportDraft) => void;
  sprintName?: string | null;
};

type ListSectionProps = {
  id: string;
  title: string;
  items?: string[];
  tone?: "neutral" | "warning";
};

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(parsed);
}

function ListSection({ id, title, items, tone = "neutral" }: ListSectionProps) {
  const isWarning = tone === "warning";

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      data-print-block="true"
      id={id}
    >
      <h2 className="text-sm font-black text-slate-900">{title}</h2>
      {items?.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li
              className={`flex gap-2.5 rounded-xl border px-3 py-2 text-sm font-medium leading-relaxed ${
                isWarning
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
              key={`${item}-${index}`}
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  isWarning ? "bg-amber-500" : "bg-brand-500"
                }`}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm font-medium text-slate-400">
          Không có dữ liệu.
        </p>
      )}
    </section>
  );
}

/**
 * Trang chi tiết báo cáo giao ban.
 *
 * Bố cục hai cột: cột chính là nội dung báo cáo, cột phải là thông tin phụ trợ
 * (ngày, sprint, nguồn dữ liệu). Cách này giúp phần đọc chính không bị các ô
 * metadata chen ngang như bản trước.
 */
export function TeamReportDetail({
  report,
  isEditing,
  draft,
  onDraftChange,
  sprintName,
}: TeamReportDetailProps) {
  const output = report.aiOutput;
  const sprintLabel = sprintName ?? (report.sprintId ? "Sprint" : "Toàn dự án");
  const dataSources = report.dataSources;

  return (
    <div className="grid gap-5" data-print-area="true">
      <section
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        data-print-block="true"
        id="team-report-header"
      >
        <div className="border-b border-brand-100 bg-brand-50/60 px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
            Báo cáo giao ban
          </p>
          <h1 className="mt-1.5 text-2xl font-black leading-tight text-slate-900">
            {output.title}
          </h1>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {formatDate(report.reportDate)} · {sprintLabel}
          </p>
        </div>

        <div className="grid gap-5 px-6 py-5">
          <TeamReportMetricCards metrics={report.metrics} />
          <div>
            <h2 className="text-sm font-black text-slate-900">Tổng quan</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {output.summary}
            </p>
          </div>
        </div>
      </section>

      {isEditing ? (
        <TeamReportEditor draft={draft} onChange={onDraftChange} />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5">
          <TeamReportSprintProgress
            metrics={report.metrics}
            sprintLabel={sprintLabel}
            teamProgress={output.teamProgress}
          />

          <div className="grid gap-5 xl:grid-cols-2">
            <ListSection
              id="team-report-completed"
              items={output.completedWork}
              title="Việc đã hoàn thành"
            />
            <ListSection
              id="team-report-today-focus"
              items={output.todayFocus}
              title="Trọng tâm hôm nay"
            />
            <ListSection
              id="team-report-blockers"
              items={output.blockers}
              title="Vướng mắc"
              tone="warning"
            />
            <ListSection
              id="team-report-risks"
              items={output.risks}
              title="Rủi ro"
              tone="warning"
            />
          </div>

          <TeamReportMemberResults
            members={output.memberSummaries ?? []}
            missingDailyUpdates={output.missingDailyUpdates ?? []}
          />

          <ListSection
            id="team-report-recommendations"
            items={output.recommendations}
            title="Đề xuất hành động"
          />

          {output.handoverSummary?.trim() ? (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              data-print-block="true"
              id="team-report-handover"
            >
              <h2 className="text-sm font-black text-slate-900">
                Bàn giao công việc
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600">
                {output.handoverSummary}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="grid content-start gap-5">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            data-print-block="true"
            id="team-report-meta"
          >
            <h2 className="text-sm font-black text-slate-900">
              Thông tin báo cáo
            </h2>
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Ngày báo cáo
                </dt>
                <dd className="font-bold text-slate-800">
                  {report.reportDate}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Phạm vi
                </dt>
                <dd className="font-bold text-slate-800">{sprintLabel}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Mô hình AI
                </dt>
                <dd className="break-all font-bold text-slate-800">
                  {report.model ?? "Không rõ"}
                </dd>
              </div>
              {report.approvedAt ? (
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Duyệt lúc
                  </dt>
                  <dd className="font-bold text-slate-800">
                    {formatDate(report.approvedAt)}
                  </dd>
                </div>
              ) : null}
              {report.editedAt ? (
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Sửa lần cuối
                  </dt>
                  <dd className="font-bold text-slate-800">
                    {formatDate(report.editedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {dataSources ? (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              data-print-block="true"
              id="team-report-data-sources"
            >
              <h2 className="text-sm font-black text-slate-900">
                Nguồn dữ liệu đã dùng
              </h2>
              <ul className="mt-3 grid gap-2">
                {[
                  { label: "Công việc & sprint", used: dataSources.tasks },
                  {
                    label: "Cập nhật hằng ngày",
                    used: dataSources.dailyUpdates,
                  },
                  {
                    label: "Biên bản họp",
                    used: dataSources.meetingTranscripts,
                  },
                  {
                    label: "Báo cáo ngày trước",
                    used: dataSources.previousReport,
                  },
                ].map((source) => (
                  <li
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                    key={source.label}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${
                        source.used ? "bg-brand-600" : "bg-slate-300"
                      }`}
                    >
                      {source.used ? "✓" : "–"}
                    </span>
                    <span className={source.used ? "" : "text-slate-400"}>
                      {source.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.extraInstruction?.trim() ? (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              data-print-block="true"
              id="team-report-extra-instruction"
            >
              <h2 className="text-sm font-black text-slate-900">
                Yêu cầu thêm khi tạo
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600">
                {report.extraInstruction}
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
