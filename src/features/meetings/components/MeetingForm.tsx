"use client";

import { FormEvent, useState } from "react";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  CreateMeetingPayload,
  Meeting,
  UpdateMeetingPayload,
} from "../types/meeting.type";

type MeetingFormProps = {
  sprints: Sprint[];
  members: WorkspaceMember[];
  initialMeeting?: Meeting | null;
  submitLabel: string;
  onSubmit: (
    payload: CreateMeetingPayload | UpdateMeetingPayload,
  ) => Promise<void>;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDatetimeLocalFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";

  return toDatetimeLocalFromDate(new Date(value));
}

function toIsoString(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function MeetingForm({
  members,
  initialMeeting,
  submitLabel,
  onSubmit,
}: MeetingFormProps) {
  const isEditing = Boolean(initialMeeting);
  const now = new Date();
  const defaultStartTime = toDatetimeLocalFromDate(now);
  const defaultEndTime = toDatetimeLocalFromDate(addHours(now, 1));

  const [title, setTitle] = useState(initialMeeting?.title ?? "");
  const [description, setDescription] = useState(
    initialMeeting?.description ?? "",
  );
  const [meetingDate, setMeetingDate] = useState(
    initialMeeting?.meetingDate ?? toDateInputValue(now),
  );
  const [startTime, setStartTime] = useState(
    toDatetimeLocal(initialMeeting?.startTime) || defaultStartTime,
  );
  const [endTime, setEndTime] = useState(
    toDatetimeLocal(initialMeeting?.endTime) || defaultEndTime,
  );
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleParticipant(userId: string) {
    setParticipantIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function syncMeetingDate(nextStartTime: string) {
    if (nextStartTime) {
      setMeetingDate(nextStartTime.slice(0, 10));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await onSubmit({
          title,
          description: description || null,
          meetingDate,
          startTime: startTime ? toIsoString(startTime) : null,
          endTime: endTime ? toIsoString(endTime) : null,
        });
      } else {
        await onSubmit({
          title,
          description: description || undefined,
          meetingType: "GENERAL",
          meetingDate,
          startTime: startTime ? toIsoString(startTime) : undefined,
          endTime: endTime ? toIsoString(endTime) : undefined,
          participantIds,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeMembers = members.filter((member) => member.status === "ACTIVE");

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Tiêu đề cuộc họp
          <input
            className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-normal outline-none transition hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            maxLength={200}
            minLength={2}
            placeholder="Lập kế hoạch Sprint 4"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Mô tả
        <textarea
          className="min-h-28 resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm font-normal leading-relaxed outline-none transition hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          maxLength={1000}
          placeholder="Nội dung chính, mục tiêu cuộc họp, ghi chú chuẩn bị..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ngày họp
          <input
            className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-normal outline-none transition hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
            type="date"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Bắt đầu
          <input
            className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-normal outline-none transition hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
            type="datetime-local"
            value={startTime}
            onChange={(event) => {
              setStartTime(event.target.value);
              syncMeetingDate(event.target.value);
            }}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Kết thúc
          <input
            className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-normal outline-none transition hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </label>

      </div>

      {!isEditing ? (
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-700">
            Người tham gia
          </span>
          <div className="grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-2">
            {activeMembers.length ? (
              activeMembers.map((member) => (
                <label
                  key={member.userId}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <input
                    checked={participantIds.includes(member.userId)}
                    className="h-4 w-4 accent-[#0c66e4]"
                    type="checkbox"
                    onChange={() => toggleParticipant(member.userId)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-[#172b4d]">
                      {member.fullName ?? member.email ?? member.userId}
                    </span>
                    <span className="block truncate text-xs font-medium text-[#6b778c]">
                      {member.role}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="px-2 py-4 text-sm font-semibold text-[#6b778c]">
                Chưa có thành viên đang hoạt động trong workspace.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <button
        className="h-11 w-fit rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Đang lưu..." : submitLabel}
      </button>
    </form>
  );
}
