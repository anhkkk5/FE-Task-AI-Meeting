"use client";

import { TaskStatus } from "../types/task.type";

type TaskStatusSelectProps = {
  value: TaskStatus;
  disabled?: boolean;
  options?: Array<{ id?: string; key: TaskStatus; label: string; enabled?: boolean }>;
  onChange: (status: TaskStatus, workflowStatusId?: string) => void;
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
  options,
  onChange,
}: TaskStatusSelectProps) {
  const visibleOptions: Array<{ id?: string; key: TaskStatus; label: string; enabled?: boolean }> = options?.filter((option) => option.enabled !== false)
    ?? statuses.map((status) => ({ key: status, label: status }));
  return (
    <select
      className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800 outline-none transition focus:border-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
      disabled={disabled}
      value={visibleOptions.find((option) => option.key === value)?.id ?? value}
      onChange={(event) => {
        const option = visibleOptions.find((item) => (item.id ?? item.key) === event.target.value);
        if (option) onChange(option.key, option.id);
      }}
    >
      {visibleOptions.map((status) => (
        <option key={status.id ?? status.key} value={status.id ?? status.key}>
          {status.label}
        </option>
      ))}
    </select>
  );
}
