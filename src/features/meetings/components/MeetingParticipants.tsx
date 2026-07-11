"use client";

import { FormEvent, useMemo, useState } from "react";
import { WorkspaceMember } from "@/features/members/types/member.type";
import {
  MeetingParticipant,
  MeetingParticipantRole,
} from "../types/meeting.type";

type MeetingParticipantsProps = {
  participants: MeetingParticipant[];
  members: WorkspaceMember[];
  currentUserId?: string;
  canManage: boolean;
  onAdd: (userId: string, role: MeetingParticipantRole) => Promise<void>;
  onToggleAttendance: (
    participantId: string,
    attended: boolean,
  ) => Promise<void>;
};

const participantRoles: { value: MeetingParticipantRole; label: string }[] = [
  { value: "PARTICIPANT", label: "Người tham gia" },
  { value: "HOST", label: "Chủ trì" },
  { value: "NOTE_TAKER", label: "Ghi chú" },
];

export function MeetingParticipants({
  participants,
  members,
  currentUserId,
  canManage,
  onAdd,
  onToggleAttendance,
}: MeetingParticipantsProps) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<MeetingParticipantRole>("PARTICIPANT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addableMembers = useMemo(() => {
    const participantUserIds = new Set(
      participants.map((participant) => participant.userId),
    );

    return members.filter(
      (member) =>
        member.status === "ACTIVE" && !participantUserIds.has(member.userId),
    );
  }, [members, participants]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    try {
      await onAdd(userId, role);
      setUserId("");
      setRole("PARTICIPANT");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      {canManage ? (
        <form
          className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]"
          onSubmit={handleSubmit}
        >
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600"
            required
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          >
            <option value="">Chọn thành viên ACTIVE</option>
            {addableMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName ?? member.email ?? member.userId} ({member.role})
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as MeetingParticipantRole)
            }
          >
            {participantRoles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-zinc-400"
            disabled={isSubmitting || !userId}
            type="submit"
          >
            {isSubmitting ? "Đang thêm..." : "Thêm"}
          </button>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-black text-zinc-950">
            Người tham gia ({participants.length})
          </h2>
        </div>
        {participants.length ? (
          <div className="divide-y divide-zinc-100">
            {participants.map((participant) => {
              const canUpdate =
                canManage || participant.userId === currentUserId;

              return (
                <div
                  key={participant.participantId}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                      {(participant.fullName ?? participant.email ?? "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-900">
                        {participant.fullName ?? participant.email ?? "Unknown"}
                      </p>
                      <p className="truncate text-xs font-medium text-zinc-500">
                        {participant.email ?? participant.userId}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-600">
                      {participant.role}
                    </span>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700">
                      <input
                        checked={participant.attended}
                        className="h-4 w-4 accent-emerald-600"
                        disabled={!canUpdate}
                        type="checkbox"
                        onChange={(event) =>
                          void onToggleAttendance(
                            participant.participantId,
                            event.target.checked,
                          )
                        }
                      />
                      Đã tham gia
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm font-semibold text-zinc-500">
            Chưa có người tham gia trong meeting này.
          </p>
        )}
      </section>
    </div>
  );
}
