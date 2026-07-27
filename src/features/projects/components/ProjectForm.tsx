"use client";

import { FormEvent, useState } from "react";

type ProjectFormPayload = {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

type ProjectFormProps = {
  initialName?: string;
  initialDescription?: string | null;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  mode: "create" | "update";
  submitLabel: string;
  onSubmit: (payload: ProjectFormPayload) => Promise<void>;
};

export function ProjectForm({
  initialName = "",
  initialDescription = "",
  initialStartDate = "",
  initialEndDate = "",
  mode,
  submitLabel,
  onSubmit,
}: ProjectFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name,
        description,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Tên dự án */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Tên dự án <span className="text-rose-500">*</span>
        </label>
        <input
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={150}
          minLength={2}
          placeholder="Ví dụ: Hệ thống quản lý công việc AI"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {mode === "create" ? (
          <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
            <svg className="h-3.5 w-3.5 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mã dự án (tiền tố cho mã công việc) sẽ được tạo tự động từ tên dự án.
          </p>
        ) : null}
      </div>

      {/* Mô tả */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Mô tả dự án
        </label>
        <textarea
          className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={1000}
          placeholder="Mô tả mục tiêu, phạm vi và thông tin quan trọng của dự án..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {/* Ngày bắt đầu & Kết thúc */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h4 className="text-sm font-bold text-slate-800">
            Thời gian thực hiện
          </h4>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Ngày bắt đầu</label>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-[#4F8EB0] focus:ring-4 focus:ring-[#4F8EB0]/15"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Ngày kết thúc</label>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-[#4F8EB0] focus:ring-4 focus:ring-[#4F8EB0]/15"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
