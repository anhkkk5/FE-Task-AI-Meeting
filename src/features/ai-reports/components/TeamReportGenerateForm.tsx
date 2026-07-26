"use client";

import { FormEvent, useEffect, useState } from "react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { GenerateTeamReportPayload } from "../types/ai-report.type";

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

export function TeamReportGenerateForm({
  sprints,
  submitLabel,
  onSubmit,
}: TeamReportGenerateFormProps) {
  const [reportDate, setReportDate] = useState("");
  const [sprintId, setSprintId] = useState("");
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
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ngày báo cáo
          <input
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            required
            type="date"
            value={reportDate}
            onChange={(event) => setReportDate(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Sprint
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            value={sprintId}
            onChange={(event) => setSprintId(event.target.value)}
          >
            <option value="">Tất cả task trong dự án</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold leading-relaxed text-indigo-950">
        Báo cáo được tổng hợp từ tiến độ công việc, sprint, cập nhật hằng ngày
        và các nhiệm vụ trong dự án.
      </div>

      <button
        className="h-11 w-fit rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang tạo báo cáo nhóm..." : submitLabel}
      </button>
    </form>
  );
}
