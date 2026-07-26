"use client";

import { FormEvent, useEffect, useState } from "react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  GenerateTeamReportPayload,
  TeamReportDataSources,
} from "../types/ai-report.type";
import { ReportDataSourcePanel } from "./ReportDataSourcePanel";

type TeamReportGenerateFormProps = {
  sprints: Sprint[];
  submitLabel: string;
  onSubmit: (payload: GenerateTeamReportPayload) => Promise<void>;
};

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const defaultDataSources: TeamReportDataSources = {
  tasks: true,
  dailyUpdates: true,
  meetingTranscripts: true,
  previousReport: true,
};

export function TeamReportGenerateForm({
  sprints,
  submitLabel,
  onSubmit,
}: TeamReportGenerateFormProps) {
  const [reportDate, setReportDate] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [dataSources, setDataSources] = useState<TeamReportDataSources>(
    defaultDataSources,
  );
  const [extraInstruction, setExtraInstruction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!reportDate) {
      setReportDate(getTodayString());
    }
  }, [reportDate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        reportDate,
        sprintId: sprintId || undefined,
        dataSources,
        extraInstruction: extraInstruction.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
      {/* Cột trái: Cấu hình nguồn dữ liệu & tham số */}
      <div className="grid gap-5 lg:col-span-7 xl:col-span-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">
            Thông tin cơ bản
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold text-slate-700">
              Ngày báo cáo
              <input
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-500"
                required
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-xs font-bold text-slate-700">
              Sprint
              <select
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-500"
                value={sprintId}
                onChange={(event) => setSprintId(event.target.value)}
              >
                <option value="">Tất cả công việc trong dự án</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.status})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <ReportDataSourcePanel
          disabled={isSubmitting}
          value={dataSources}
          onChange={setDataSources}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">
            Yêu cầu bổ sung cho AI (Tùy chọn)
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Ví dụ: Nhấn mạnh vào tiến độ phần Backend, hoặc tập trung phân tích
            các rủi ro sắp tới.
          </p>
          <textarea
            className="mt-3 min-h-[96px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-500"
            disabled={isSubmitting}
            placeholder="Nhập ghi chú hoặc yêu cầu riêng cho AI..."
            value={extraInstruction}
            onChange={(event) => setExtraInstruction(event.target.value)}
          />
        </section>
      </div>

      {/* Cột phải: Xem trước & nút bấm hành động */}
      <div className="grid content-start gap-5 lg:col-span-5 xl:col-span-4">
        <section className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 shadow-sm">
          <h2 className="text-sm font-black text-brand-900">Xác nhận tạo</h2>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-brand-800">
            AI sẽ tự động thu thập công việc, tiến độ sprint và các cập nhật
            hằng ngày từ nguồn dữ liệu được chọn để tạo báo cáo giao ban.
          </p>

          <button
            className="mt-5 h-12 w-full rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang xử lý tạo báo cáo..." : submitLabel}
          </button>
        </section>
      </div>
    </form>
  );
}
