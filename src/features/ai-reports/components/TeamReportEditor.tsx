"use client";

import {
  TeamDailyReportOutput,
  UpdateTeamReportPayload,
} from "../types/ai-report.type";

export type TeamReportDraft = {
  summary: string;
  teamProgress: string;
  completedWork: string;
  todayFocus: string;
  blockers: string;
  risks: string;
  recommendations: string;
};

type TeamReportEditorProps = {
  draft: TeamReportDraft;
  onChange: (draft: TeamReportDraft) => void;
};

/** Moi dong trong textarea la mot muc cua danh sach. */
function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildDraftFromOutput(
  output: TeamDailyReportOutput,
): TeamReportDraft {
  return {
    summary: output.summary ?? "",
    teamProgress: output.teamProgress ?? "",
    completedWork: (output.completedWork ?? []).join("\n"),
    todayFocus: (output.todayFocus ?? []).join("\n"),
    blockers: (output.blockers ?? []).join("\n"),
    risks: (output.risks ?? []).join("\n"),
    recommendations: (output.recommendations ?? []).join("\n"),
  };
}

/**
 * Chi gui len nhung muc thuc su khac ban goc.
 *
 * Neu gui tat ca thi moi lan luu deu ghi de toan bo ban AI, ke ca nhung muc
 * nguoi dung khong cham toi, khien kho biet ai da sua gi.
 */
export function buildUpdatePayload(
  draft: TeamReportDraft,
  original: TeamReportDraft,
): UpdateTeamReportPayload {
  const payload: UpdateTeamReportPayload = {};

  if (draft.summary.trim() !== original.summary.trim()) {
    payload.summary = draft.summary.trim();
  }
  if (draft.teamProgress.trim() !== original.teamProgress.trim()) {
    payload.teamProgress = draft.teamProgress.trim();
  }
  if (draft.completedWork !== original.completedWork) {
    payload.completedWork = linesToList(draft.completedWork);
  }
  if (draft.todayFocus !== original.todayFocus) {
    payload.todayFocus = linesToList(draft.todayFocus);
  }
  if (draft.blockers !== original.blockers) {
    payload.blockers = linesToList(draft.blockers);
  }
  if (draft.risks !== original.risks) {
    payload.risks = linesToList(draft.risks);
  }
  if (draft.recommendations !== original.recommendations) {
    payload.recommendations = linesToList(draft.recommendations);
  }

  return payload;
}

const listFields: {
  key: keyof TeamReportDraft;
  label: string;
  hint: string;
}[] = [
  {
    key: "completedWork",
    label: "Việc đã hoàn thành",
    hint: "Mỗi dòng một việc",
  },
  {
    key: "todayFocus",
    label: "Trọng tâm hôm nay",
    hint: "Mỗi dòng một trọng tâm",
  },
  { key: "blockers", label: "Vướng mắc", hint: "Mỗi dòng một vướng mắc" },
  { key: "risks", label: "Rủi ro", hint: "Mỗi dòng một rủi ro" },
  {
    key: "recommendations",
    label: "Đề xuất hành động",
    hint: "Mỗi dòng một đề xuất",
  },
];

/**
 * Khung sua noi dung bao cao truoc khi duyet.
 *
 * Khong cho sua so lieu (`metrics`) vi cac con so phai bam theo du lieu that
 * trong he thong; sua tay thi bao cao mat gia tri doi chieu.
 */
export function TeamReportEditor({ draft, onChange }: TeamReportEditorProps) {
  const update = (key: keyof TeamReportDraft, value: string) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <section
      className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5 shadow-sm"
      id="team-report-editor"
    >
      <h2 className="text-sm font-black text-slate-900">
        Sửa nội dung trước khi duyệt
      </h2>
      <p className="mt-1 text-xs font-medium text-slate-500">
        Số liệu thống kê được tính từ dữ liệu thật của dự án nên không sửa được.
      </p>

      <div className="mt-4 grid gap-4">
        <label
          className="grid gap-2 text-xs font-bold text-slate-700"
          htmlFor="team-report-edit-summary"
        >
          Tóm tắt tổng quan
          <textarea
            className="min-h-[88px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-500"
            id="team-report-edit-summary"
            value={draft.summary}
            onChange={(event) => update("summary", event.target.value)}
          />
        </label>

        <label
          className="grid gap-2 text-xs font-bold text-slate-700"
          htmlFor="team-report-edit-progress"
        >
          Diễn giải tiến độ
          <textarea
            className="min-h-[88px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-500"
            id="team-report-edit-progress"
            value={draft.teamProgress}
            onChange={(event) => update("teamProgress", event.target.value)}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          {listFields.map((field) => (
            <label
              className="grid gap-2 text-xs font-bold text-slate-700"
              htmlFor={`team-report-edit-${field.key}`}
              key={field.key}
            >
              <span className="flex items-baseline justify-between gap-2">
                {field.label}
                <span className="text-[10px] font-medium text-slate-400">
                  {field.hint}
                </span>
              </span>
              <textarea
                className="min-h-[104px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-500"
                id={`team-report-edit-${field.key}`}
                value={draft[field.key]}
                onChange={(event) => update(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
