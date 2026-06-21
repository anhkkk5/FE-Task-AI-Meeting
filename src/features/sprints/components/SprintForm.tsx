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
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Tên sprint
        <input
          className="h-11 rounded-xl border border-zinc-300 px-3 text-sm font-normal outline-none transition focus:border-zinc-900"
          maxLength={150}
          minLength={2}
          placeholder="Sprint 1 - Phân tích và thiết kế"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Mục tiêu
        <textarea
          className="min-h-32 resize-y rounded-xl border border-zinc-300 px-3 py-2 text-sm font-normal outline-none transition focus:border-zinc-900"
          maxLength={1000}
          placeholder="Mục tiêu cần hoàn thành trong sprint này..."
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ngày bắt đầu
          <input
            className="h-11 rounded-xl border border-zinc-300 px-3 text-sm font-normal outline-none transition focus:border-zinc-900"
            required
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ngày kết thúc
          <input
            className="h-11 rounded-xl border border-zinc-300 px-3 text-sm font-normal outline-none transition focus:border-zinc-900"
            required
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
      </div>

      <button
        className="h-11 w-fit rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang lưu..." : submitLabel}
      </button>
    </form>
  );
}
