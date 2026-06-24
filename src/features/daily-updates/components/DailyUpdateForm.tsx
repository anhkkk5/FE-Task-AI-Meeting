"use client";

import { FormEvent, useEffect, useState } from "react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  CreateDailyUpdatePayload,
  DailyMood,
  DailyUpdate,
  UpdateDailyUpdatePayload,
} from "../types/daily-update.type";

type DailyUpdateFormProps = {
  sprints: Sprint[];
  initialDailyUpdate?: DailyUpdate | null;
  submitLabel: string;
  onSubmit: (
    payload: CreateDailyUpdatePayload | UpdateDailyUpdatePayload,
  ) => Promise<void>;
};

const moodOptions: { value: DailyMood; label: string; tone: string }[] = [
  {
    value: "GOOD",
    label: "Tốt",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "NORMAL",
    label: "Bình thường",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    value: "BLOCKED",
    label: "Bị chặn",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    value: "TIRED",
    label: "Mệt",
    tone: "border-zinc-200 bg-zinc-50 text-zinc-700",
  },
];

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function DailyUpdateForm({
  sprints,
  initialDailyUpdate,
  submitLabel,
  onSubmit,
}: DailyUpdateFormProps) {
  const isEditing = Boolean(initialDailyUpdate);
  const [updateDate, setUpdateDate] = useState(
    initialDailyUpdate?.updateDate ?? "",
  );
  const [sprintId, setSprintId] = useState(initialDailyUpdate?.sprintId ?? "");
  const [yesterdayWork, setYesterdayWork] = useState(
    initialDailyUpdate?.yesterdayWork ?? "",
  );
  const [todayPlan, setTodayPlan] = useState(
    initialDailyUpdate?.todayPlan ?? "",
  );
  const [blockers, setBlockers] = useState(initialDailyUpdate?.blockers ?? "");
  const [notes, setNotes] = useState(initialDailyUpdate?.notes ?? "");
  const [mood, setMood] = useState<DailyMood | "">(
    initialDailyUpdate?.mood ?? "NORMAL",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing && !updateDate) {
      setUpdateDate(getTodayString());
    }
  }, [isEditing, updateDate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await onSubmit({
          sprintId: sprintId || null,
          yesterdayWork,
          todayPlan,
          blockers: blockers || null,
          notes: notes || null,
          mood: mood || null,
        });
      } else {
        await onSubmit({
          sprintId: sprintId || undefined,
          updateDate,
          yesterdayWork,
          todayPlan,
          blockers: blockers || undefined,
          notes: notes || undefined,
          mood: mood || undefined,
        });
      }
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
            disabled={isEditing}
            required
            type="date"
            value={updateDate}
            onChange={(event) => setUpdateDate(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Sprint liên quan
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            value={sprintId}
            onChange={(event) => setSprintId(event.target.value)}
          >
            <option value="">Không gắn sprint</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status})
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Hôm qua đã làm gì?
        <textarea
          className="min-h-36 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed outline-none transition focus:border-blue-600"
          maxLength={3000}
          minLength={2}
          placeholder="Ví dụ: Hoàn thành API tạo task, sửa validation, review pull request..."
          required
          value={yesterdayWork}
          onChange={(event) => setYesterdayWork(event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Hôm nay dự định làm gì?
        <textarea
          className="min-h-36 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed outline-none transition focus:border-blue-600"
          maxLength={3000}
          minLength={2}
          placeholder="Ví dụ: Viết test case, làm màn hình board, xử lý bug phân quyền..."
          required
          value={todayPlan}
          onChange={(event) => setTodayPlan(event.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Blocker
          <textarea
            className="min-h-28 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed outline-none transition focus:border-blue-600"
            maxLength={3000}
            placeholder="Có vướng mắc nào đang chặn tiến độ không?"
            value={blockers}
            onChange={(event) => setBlockers(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ghi chú
          <textarea
            className="min-h-28 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed outline-none transition focus:border-blue-600"
            maxLength={3000}
            placeholder="Thông tin bổ sung cho scrum master hoặc team."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-700">Tâm trạng</span>
        <div className="grid gap-2 sm:grid-cols-4">
          {moodOptions.map((item) => (
            <button
              key={item.value}
              className={`h-10 rounded-xl border px-3 text-xs font-bold transition ${
                mood === item.value
                  ? item.tone
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              }`}
              type="button"
              onClick={() => setMood(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="h-11 w-fit rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang lưu..." : submitLabel}
      </button>
    </form>
  );
}
