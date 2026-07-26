"use client";

import { TeamReportDataSources } from "../types/ai-report.type";

type ReportDataSourcePanelProps = {
  value: TeamReportDataSources;
  disabled?: boolean;
  onChange: (value: TeamReportDataSources) => void;
};

type SourceOption = {
  key: keyof TeamReportDataSources;
  label: string;
  hint: string;
};

/**
 * Mo ta tung nguon de nguoi dung biet tat di thi mat gi.
 *
 * Viet ro hau qua thay vi chi ten nguon, vi nguoi dung khong the biet "cap nhat
 * hang ngay" anh huong den phan nao cua bao cao.
 */
const sourceOptions: SourceOption[] = [
  {
    key: "tasks",
    label: "Công việc & sprint",
    hint: "Số liệu tiến độ, việc quá hạn, phân bổ theo thành viên.",
  },
  {
    key: "dailyUpdates",
    label: "Cập nhật hằng ngày",
    hint: "Việc hôm qua, kế hoạch hôm nay và vướng mắc tự khai báo.",
  },
  {
    key: "meetingTranscripts",
    label: "Biên bản cuộc họp",
    hint: "Quyết định đã chốt và việc cần làm rút ra từ cuộc họp.",
  },
  {
    key: "previousReport",
    label: "Báo cáo ngày trước",
    hint: "Dùng để đối chiếu, chỉ ra việc còn tồn từ hôm trước.",
  },
];

/**
 * Bang chon nguon du lieu cho AI truoc khi sinh bao cao.
 *
 * Ly do cho phep tat: co ngay nhom khong hop hoac chua ai gui cap nhat, luc do
 * bat het nguon chi lam bao cao day nhung dong "chua co du lieu".
 */
export function ReportDataSourcePanel({
  value,
  disabled,
  onChange,
}: ReportDataSourcePanelProps) {
  const activeCount = sourceOptions.filter((option) => value[option.key]).length;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      id="report-data-source-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900">Nguồn dữ liệu</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            AI chỉ được dùng những nguồn bạn bật.
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-black text-brand-700">
          {activeCount}/{sourceOptions.length}
        </span>
      </div>

      <ul className="mt-4 grid gap-2.5">
        {sourceOptions.map((option) => {
          const checked = value[option.key];

          return (
            <li key={option.key}>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? "border-brand-300 bg-brand-50/60"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                htmlFor={`data-source-${option.key}`}
              >
                <input
                  checked={checked}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                  disabled={disabled}
                  id={`data-source-${option.key}`}
                  type="checkbox"
                  onChange={(event) =>
                    onChange({ ...value, [option.key]: event.target.checked })
                  }
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500">
                    {option.hint}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
