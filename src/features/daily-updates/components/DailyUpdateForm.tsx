"use client";

import { FormEvent, useEffect, useState } from "react";
import { draftMyDailyUpdate } from "@/features/ai-reports/api/ai-reports.api";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  CreateDailyUpdatePayload,
  DailyMood,
  DailyUpdate,
  UpdateDailyUpdatePayload,
} from "../types/daily-update.type";

type DailyUpdateFormProps = {
  workspaceId: string;
  projectId: string;
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
  workspaceId,
  projectId,
  sprints,
  initialDailyUpdate,
  submitLabel,
  onSubmit,
}: DailyUpdateFormProps) {
  const isEditing = initialDailyUpdate?.submissionStatus === "SUBMITTED";
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
  const [needHelpFromId, setNeedHelpFromId] = useState(
    initialDailyUpdate?.needHelpFromId ?? "",
  );
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing && !updateDate) {
      setUpdateDate(getTodayString());
    }
  }, [isEditing, updateDate]);

  /*
   * Danh sach nguoi co the nho ho tro.
   *
   * Chi lay thanh vien ACTIVE: nguoi da roi workspace thi khong nho duoc nua,
   * va backend cung tu choi id do.
   */
  useEffect(() => {
    let isActive = true;

    getWorkspaceMembers(workspaceId)
      .then((response) => {
        if (!isActive) return;
        setMembers(
          response.data.items.filter((member) => member.status === "ACTIVE"),
        );
      })
      .catch(() => {
        // Khong chan viec gui bao cao chi vi khong tai duoc danh sach thanh vien.
        if (isActive) setMembers([]);
      });

    return () => {
      isActive = false;
    };
  }, [workspaceId]);

  /**
   * Nho AI soan nhap tu task va ban giao trong ngay.
   *
   * Chi dien vao o dang trong: nguoi dung da viet gi thi giu nguyen, tranh mat
   * cong go lai vi bam nut.
   */
  async function handleDraftWithAi() {
    setIsDrafting(true);
    setDraftError(null);

    try {
      const response = await draftMyDailyUpdate(workspaceId, projectId, {
        updateDate: updateDate || getTodayString(),
        sprintId: sprintId || null,
      });
      const draft = response.data.draft;

      if (!yesterdayWork.trim()) setYesterdayWork(draft.yesterdayWork);
      if (!todayPlan.trim()) setTodayPlan(draft.todayPlan);
      if (!blockers.trim()) setBlockers(draft.blockers);
      if (!notes.trim()) setNotes(draft.notes);
    } catch (error) {
      setDraftError(
        error instanceof Error
          ? error.message
          : "Không soạn được bản nháp, bạn thử lại sau nhé.",
      );
    } finally {
      setIsDrafting(false);
    }
  }

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
          needHelpFromId: needHelpFromId || null,
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
          needHelpFromId: needHelpFromId || undefined,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <div className="grid gap-0.5">
          <span className="text-sm font-semibold text-brand-700">
            Chưa biết viết gì?
          </span>
          <span className="text-xs text-zinc-600">
            AI đọc task và bàn giao trong ngày để soạn sẵn bản nháp, bạn sửa lại
            trước khi gửi.
          </span>
        </div>
        <button
          className="h-10 shrink-0 rounded-xl border border-brand-600 bg-white px-4 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
          disabled={isDrafting}
          id="daily-update-ai-draft"
          type="button"
          onClick={handleDraftWithAi}
        >
          {isDrafting ? "Đang soạn..." : "AI soạn nháp"}
        </button>
      </div>

      {draftError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          {draftError}
        </p>
      ) : null}

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
            className="min-h-28 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed outline-none transition focus:border-brand-600"
            maxLength={3000}
            placeholder="Có vướng mắc nào đang chặn tiến độ không?"
            value={blockers}
            onChange={(event) => setBlockers(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ghi chú
          <textarea
            className="min-h-28 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed outline-none transition focus:border-brand-600"
            maxLength={3000}
            placeholder="Thông tin bổ sung cho scrum master hoặc team."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Cần ai hỗ trợ?
        <select
          className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-brand-600"
          id="daily-update-need-help-from"
          value={needHelpFromId}
          onChange={(event) => setNeedHelpFromId(event.target.value)}
        >
          <option value="">Không cần ai hỗ trợ</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName ?? member.email ?? member.userId}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-zinc-500">
          Người được chọn sẽ thấy đề nghị hỗ trợ trong báo cáo giao ban.
        </span>
      </label>

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
        className="h-11 w-fit rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang lưu..." : submitLabel}
      </button>
    </form>
  );
}
