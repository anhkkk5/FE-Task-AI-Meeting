"use client";

import { WorkspaceMember } from "@/features/members/types/member.type";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { DailyUpdateQuery } from "../types/daily-update.type";

type DailyUpdateFilterProps = {
  members?: WorkspaceMember[];
  sprints: Sprint[];
  query: DailyUpdateQuery;
  showMemberFilter?: boolean;
  onChange: (query: DailyUpdateQuery) => void;
  onRefresh: () => void;
};

export function DailyUpdateFilter({
  members = [],
  sprints,
  query,
  showMemberFilter = false,
  onChange,
  onRefresh,
}: DailyUpdateFilterProps) {
  function setField<K extends keyof DailyUpdateQuery>(
    field: K,
    value: DailyUpdateQuery[K],
  ) {
    onChange({
      ...query,
      [field]: value || undefined,
      page: 1,
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-6">
        <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Một ngày
          <input
            className="h-10 rounded-xl border border-zinc-300 px-3 text-sm font-medium normal-case tracking-normal text-zinc-700 outline-none focus:border-blue-600"
            type="date"
            value={query.date ?? ""}
            onChange={(event) => setField("date", event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Từ ngày
          <input
            className="h-10 rounded-xl border border-zinc-300 px-3 text-sm font-medium normal-case tracking-normal text-zinc-700 outline-none focus:border-blue-600"
            disabled={Boolean(query.date)}
            type="date"
            value={query.fromDate ?? ""}
            onChange={(event) => setField("fromDate", event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Đến ngày
          <input
            className="h-10 rounded-xl border border-zinc-300 px-3 text-sm font-medium normal-case tracking-normal text-zinc-700 outline-none focus:border-blue-600"
            disabled={Boolean(query.date)}
            type="date"
            value={query.toDate ?? ""}
            onChange={(event) => setField("toDate", event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Sprint
          <select
            className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-700 outline-none focus:border-blue-600"
            value={query.sprintId ?? ""}
            onChange={(event) => setField("sprintId", event.target.value)}
          >
            <option value="">Tất cả sprint</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>
        </label>
        {showMemberFilter ? (
          <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Thành viên
            <select
              className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-700 outline-none focus:border-blue-600"
              value={query.memberId ?? ""}
              onChange={(event) => setField("memberId", event.target.value)}
            >
              <option value="">Tất cả thành viên</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName || member.email || member.userId}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-end gap-2">
          <button
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            type="button"
            onClick={onRefresh}
          >
            Làm mới
          </button>
          <button
            className="h-10 rounded-xl bg-zinc-900 px-4 text-xs font-bold text-white transition hover:bg-zinc-800"
            type="button"
            onClick={() => onChange({ page: 1, limit: query.limit ?? 20 })}
          >
            Xóa lọc
          </button>
        </div>
      </div>
    </div>
  );
}
