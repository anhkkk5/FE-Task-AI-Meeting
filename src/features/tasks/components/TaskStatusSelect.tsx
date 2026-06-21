"use client";

import { TaskStatus } from "../types/task.type";

type TaskStatusSelectProps = {
  value: TaskStatus;
  disabled?: boolean;
  onChange: (status: TaskStatus) => void;
};

const statuses: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "CANCELLED",
];

export function TaskStatusSelect({
  value,
  disabled,
  onChange,
}: TaskStatusSelectProps) {
  return (
    <select
      className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800 outline-none transition focus:border-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as TaskStatus)}
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
