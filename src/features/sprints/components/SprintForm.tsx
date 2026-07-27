"use client";

import { FormEvent, useState } from "react";

type SprintFormPayload = {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
};

type SprintFormProps = {
  initialName?: string;
  initialGoal?: string | null;
  initialStartDate?: string;
  initialEndDate?: string;
  submitLabel: string;
  onSubmit: (payload: SprintFormPayload) => Promise<void>;
};

export function SprintForm({
  initialName = "",
  initialGoal = "",
  initialStartDate = "",
  initialEndDate = "",
  submitLabel,
  onSubmit,
}: SprintFormProps) {
  const [name, setName] = useState(initialName);
  const [goal, setGoal] = useState(initialGoal ?? "");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name,
        goal: goal || undefined,
        startDate,
        endDate,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Tên sprint */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Tên Sprint <span className="text-rose-500">*</span>
        </label>
        <input
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={150}
          minLength={2}
          placeholder="Ví dụ: Sprint 1 - Phân tích & Phát triển giao diện"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      {/* Mục tiêu */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mục tiêu Sprint
        </label>
        <textarea
          className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={1000}
          placeholder="Mục tiêu cốt lõi cần đạt được trong chu kỳ sprint này..."
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
      </div>

      {/* Ngày bắt đầu & Kết thúc */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h4 className="text-sm font-bold text-slate-800">
            Thời gian diễn ra Sprint
          </h4>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Ngày bắt đầu <span className="text-rose-500">*</span></label>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-[#4F8EB0] focus:ring-4 focus:ring-[#4F8EB0]/15"
              required
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Ngày kết thúc <span className="text-rose-500">*</span></label>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-[#4F8EB0] focus:ring-4 focus:ring-[#4F8EB0]/15"
              required
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Button submit */}
      <div className="pt-2 flex items-center justify-end">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F8EB0] px-6 text-sm font-bold text-white shadow-md shadow-[#4F8EB0]/25 transition-all hover:bg-[#3d7290] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang lưu...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
