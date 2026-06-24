"use client";

import { FormEvent, useEffect, useState } from "react";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  CreateMeetingPayload,
  Meeting,
  MeetingType,
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

const meetingTypeOptions: { value: MeetingType; label: string }[] = [
  { value: "SPRINT_PLANNING", label: "Sprint planning" },
  { value: "DAILY_SCRUM", label: "Daily scrum" },
  { value: "SPRINT_REVIEW", label: "Sprint review" },
  { value: "RETROSPECTIVE", label: "Retrospective" },
  { value: "GENERAL", label: "General" },
];

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function MeetingForm({
  sprints,
  members,
  initialMeeting,
  submitLabel,
  onSubmit,
}: MeetingFormProps) {
  const isEditing = Boolean(initialMeeting);
  const [title, setTitle] = useState(initialMeeting?.title ?? "");
  const [description, setDescription] = useState(
    initialMeeting?.description ?? "",
  );
  const [meetingType, setMeetingType] = useState<MeetingType>(
    initialMeeting?.meetingType ?? "GENERAL",
  );
  const [meetingDate, setMeetingDate] = useState(
    initialMeeting?.meetingDate ?? "",
  );
  const [sprintId, setSprintId] = useState(initialMeeting?.sprintId ?? "");
  const [startTime, setStartTime] = useState(
    toDatetimeLocal(initialMeeting?.startTime),
  );
  const [endTime, setEndTime] = useState(
    toDatetimeLocal(initialMeeting?.endTime),
  );
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing && !meetingDate) {
      setMeetingDate(getTodayString());
    }
  }, [isEditing, meetingDate]);

  function toggleParticipant(userId: string) {
    setParticipantIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await onSubmit({
          sprintId: sprintId || null,
          title,
          description: description || null,
          meetingType,
          meetingDate,
          startTime: startTime ? toIsoString(startTime) : null,
          endTime: endTime ? toIsoString(endTime) : null,
        });
      } else {
        await onSubmit({
          sprintId: sprintId || undefined,
          title,
          description: description || undefined,
          meetingType,
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
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Tieu de meeting
          <input
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            maxLength={200}
            minLength={2}
            placeholder="Sprint Planning - Sprint 4"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Loai meeting
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            value={meetingType}
            onChange={(event) => setMeetingType(event.target.value as MeetingType)}
          >
            {meetingTypeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Mo ta
        <textarea
          className="min-h-28 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed outline-none transition focus:border-blue-600"
          maxLength={1000}
          placeholder="Noi dung chinh, muc tieu cuoc hop, ghi chu chuan bi..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ngay hop
          <input
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            required
            type="date"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Bat dau
          <input
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Ket thuc
          <input
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Sprint
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-blue-600"
            value={sprintId}
            onChange={(event) => setSprintId(event.target.value)}
          >
            <option value="">Khong gan sprint</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!isEditing ? (
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-700">
            Participants
          </span>
          <div className="grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-2">
            {activeMembers.length ? (
              activeMembers.map((member) => (
                <label
                  key={member.userId}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <input
                    checked={participantIds.includes(member.userId)}
                    className="h-4 w-4 accent-blue-600"
                    type="checkbox"
                    onChange={() => toggleParticipant(member.userId)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-zinc-800">
                      {member.fullName ?? member.email ?? member.userId}
                    </span>
                    <span className="block truncate text-xs font-medium text-zinc-500">
                      {member.role}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="px-2 py-4 text-sm font-semibold text-zinc-500">
                Chua co member ACTIVE trong workspace.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <button
        className="h-11 w-fit rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Dang luu..." : submitLabel}
      </button>
    </form>
  );
}
