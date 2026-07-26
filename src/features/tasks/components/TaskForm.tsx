"use client";

import { FormEvent, useState } from "react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { CreateTaskPayload } from "../types/task.type";

type TaskFormProps = {
  members: WorkspaceMember[];
  sprints: Sprint[];
  submitLabel: string;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
};

export function TaskForm({
  members,
  sprints,
  submitLabel,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description: description || undefined,
        sprintId: sprintId || undefined,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Tiêu đề task
        <input
          className="h-11 rounded-xl border border-zinc-300 px-3 text-sm font-normal outline-none transition focus:border-zinc-900"
          maxLength={200}
          minLength={2}
          placeholder="Code API tạo task"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-700">
        Mô tả
        <textarea
          className="min-h-32 resize-y rounded-xl border border-zinc-300 px-3 py-2 text-sm font-normal outline-none transition focus:border-zinc-900"
          maxLength={2000}
          placeholder="Mô tả chi tiết công việc cần hoàn thành..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Sprint
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-zinc-900"
            value={sprintId}
            onChange={(event) => setSprintId(event.target.value)}
          >
            <option value="">Backlog</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Assignee
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-zinc-900"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <option value="">Chưa gán</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName || member.email || member.userId}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Due date
          <input
            className="h-11 rounded-xl border border-zinc-300 px-3 text-sm font-normal outline-none transition focus:border-zinc-900"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
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
