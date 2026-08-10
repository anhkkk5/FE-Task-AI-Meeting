"use client";

import { FormEvent, useState } from "react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { CreateTaskPayload, Task, TaskPriority, TaskType } from "../types/task.type";

type TaskFormProps = {
  members: WorkspaceMember[];
  sprints: Sprint[];
  parentCandidates?: Task[];
  submitLabel: string;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
};

export function TaskForm({
  members,
  sprints,
  parentCandidates = [],
  submitLabel,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [labels, setLabels] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("TASK");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [parentId, setParentId] = useState("");
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
        taskType,
        priority,
        parentId: parentId || undefined,
        storyPoints: storyPoints ? Number(storyPoints) : undefined,
        labels: labels.split(",").map((label) => label.trim()).filter(Boolean),
        acceptanceCriteria: acceptanceCriteria || undefined,
        reporterId: reporterId || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Tiêu đề task */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Tiêu đề task <span className="text-rose-500">*</span>
        </label>
        <input
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={200}
          minLength={2}
          placeholder="Ví dụ: Code API tạo task"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-800">Nhãn công việc<input className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm" onChange={(event) => setLabels(event.target.value)} placeholder="frontend, api, khách-hàng" value={labels} /><span className="text-xs font-normal text-slate-500">Phân cách nhiều nhãn bằng dấu phẩy.</span></label>
        <label className="grid gap-2 text-sm font-bold text-slate-800">Người báo cáo<select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setReporterId(event.target.value)} value={reporterId}><option value="">Mặc định là người tạo</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.fullName || member.email}</option>)}</select></label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-800">Tiêu chí nghiệm thu<textarea className="min-h-28 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium" maxLength={4000} onChange={(event) => setAcceptanceCriteria(event.target.value)} placeholder="Điều kiện để công việc được xem là hoàn thành..." value={acceptanceCriteria} /></label>

      {/* Mô tả công việc */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Mô tả công việc
        </label>
        <textarea
          className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={2000}
          placeholder="Mô tả chi tiết công việc cần hoàn thành, yêu cầu kỹ thuật..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {/* Khung Phân công & Kế hoạch */}
      <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 sm:grid-cols-3 sm:p-6">
        <label className="grid gap-2 text-xs font-bold text-slate-700">
          Loại công việc
          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" onChange={(event) => { const value = event.target.value as TaskType; setTaskType(value); if (value === "EPIC" || value === "TASK" || value === "BUG") setParentId(""); }} value={taskType}>
            <option value="EPIC">Epic</option><option value="STORY">Story</option><option value="TASK">Task</option><option value="BUG">Bug</option><option value="SUBTASK">Subtask</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs font-bold text-slate-700">
          Độ ưu tiên
          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setPriority(event.target.value as TaskPriority)} value={priority}>
            <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs font-bold text-slate-700">
          Công việc cha
          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-100" disabled={taskType !== "STORY" && taskType !== "SUBTASK"} onChange={(event) => setParentId(event.target.value)} required={taskType === "SUBTASK"} value={parentId}>
            <option value="">{taskType === "SUBTASK" ? "Chọn công việc cha" : "Không có"}</option>
            {parentCandidates.filter((item) => taskType === "STORY" ? item.taskType === "EPIC" : taskType === "SUBTASK" ? ["STORY", "TASK", "BUG"].includes(item.taskType) : false).map((item) => <option key={item.id} value={item.id}>{item.taskCode} · {item.title}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-xs font-bold text-slate-700">
          Story Point
          <input className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" min="0" onChange={(event) => setStoryPoints(event.target.value)} placeholder="Ví dụ: 3" step="1" type="number" value={storyPoints} />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h4 className="text-sm font-bold text-slate-800">
            Phân công & Kế hoạch
          </h4>
        </div>

        {/* 3 cột độc lập, tách bạch nhãn và ô nhập */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {/* Sprint */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Sprint</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-[#4F8EB0] focus:ring-4 focus:ring-[#4F8EB0]/15"
              value={sprintId}
              onChange={(event) => setSprintId(event.target.value)}
            >
              <option value="">Backlog (Chưa gán Sprint)</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} ({sprint.status})
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Người phụ trách</label>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-[#4F8EB0] focus:ring-4 focus:ring-[#4F8EB0]/15"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <option value="">Chưa gán người làm</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName || member.email || member.userId}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Hạn hoàn thành (Due date)</label>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-[#4F8EB0] focus:ring-4 focus:ring-[#4F8EB0]/15"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Button submit */}
      <div className="pt-2 flex items-center justify-end">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F8EB0] px-6 text-sm font-bold text-white shadow-md shadow-[#4F8EB0]/25 transition-all hover:bg-[#3d7290] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang lưu...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
