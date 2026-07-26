"use client";

import { FormEvent, useEffect, useState } from "react";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { GeneratePersonalReportPayload } from "../types/ai-report.type";

type PersonalReportGenerateFormProps = {
  sprints: Sprint[];
  members: WorkspaceMember[];
  canManage: boolean;
  submitLabel: string;
  onSubmit: (
    payload: GeneratePersonalReportPayload,
    memberId?: string,
  ) => Promise<void>;
};

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function PersonalReportGenerateForm({
  sprints,
  members,
  canManage,
  submitLabel,
  onSubmit,
}: PersonalReportGenerateFormProps) {
  const [reportDate, setReportDate] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [memberId, setMemberId] = useState("");
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
      await onSubmit(
        {
          reportDate,
          sprintId: sprintId || undefined,
        },
        canManage && memberId ? memberId : undefined,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeMembers = members.filter((member) => member.status === "ACTIVE");

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-3">
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

        {canManage ? (
          <label className="grid gap-2 text-sm font-semibold text-zinc-700">
            Thành viên
            <select
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
            >
              <option value="">Tạo cho chính mình</option>
              {activeMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName ?? member.email ?? member.userId} ({member.role})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm font-semibold leading-relaxed text-brand-900">
        Báo cáo được tổng hợp từ tiến độ công việc, sprint, cập nhật hằng ngày
        và các bàn giao công việc của bạn.
      </div>

      <button
        className="h-11 w-fit rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang tạo báo cáo AI..." : submitLabel}
      </button>
    </form>
  );
}
