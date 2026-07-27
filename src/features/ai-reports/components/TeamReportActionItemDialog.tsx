"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { Task } from "@/features/tasks/types/task.type";

export type ActionItemDialogMode =
  | "create-task"
  | "request-handover"
  | "dismiss";

export type ActionItemDialogResult = {
  assigneeId?: string;
  dueDate?: string;
  taskId?: string;
  suggestedReceiverId?: string;
  note?: string;
};

type TeamReportActionItemDialogProps = {
  mode: ActionItemDialogMode;
  /** Noi dung vuong mac / de xuat dang xu ly, hien lai de nguoi dung khong bam nham dong. */
  itemText: string;
  members: WorkspaceMember[];
  /** Chi dung cho de nghi ban giao: chon task tu danh sach thay vi go UUID. */
  tasks: Task[];
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (result: ActionItemDialogResult) => void;
};

const dialogCopy: Record<
  ActionItemDialogMode,
  { title: string; description: string; confirmLabel: string }
> = {
  "create-task": {
    title: "Tạo task từ nội dung này",
    description:
      "Chọn người xử lý và hạn hoàn thành. Task sẽ được tạo trong sprint của phiên giao ban.",
    confirmLabel: "Tạo task",
  },
  "request-handover": {
    title: "Đề nghị bàn giao",
    description:
      "Người đang giữ task sẽ nhận lời nhắc tự điền thông tin bàn giao. Người phụ trách chưa thay đổi ở bước này.",
    confirmLabel: "Gửi đề nghị",
  },
  dismiss: {
    title: "Bỏ qua nội dung này",
    description:
      "Nội dung vẫn được lưu trong báo cáo, chỉ đánh dấu là không cần xử lý.",
    confirmLabel: "Bỏ qua",
  },
};

/**
 * Hop thoai xu ly mot muc vuong mac / de xuat.
 *
 * Gop ba hanh dong vao mot component vi chung dung chung khung va danh sach
 * thanh vien; tach ra thi phai lap lai phan tai danh sach o ba cho.
 */
export function TeamReportActionItemDialog({
  mode,
  itemText,
  members,
  tasks,
  isSubmitting,
  onCancel,
  onConfirm,
}: TeamReportActionItemDialogProps) {
  const copy = dialogCopy[mode];
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskId, setTaskId] = useState("");
  const [suggestedReceiverId, setSuggestedReceiverId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "ACTIVE"),
    [members],
  );

  const isValid =
    mode !== "request-handover" || Boolean(taskId && suggestedReceiverId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    if (mode === "create-task") {
      onConfirm({
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      });
      return;
    }

    if (mode === "request-handover") {
      onConfirm({
        taskId,
        suggestedReceiverId,
        note: note.trim() || undefined,
      });
      return;
    }

    onConfirm({ note: note.trim() || undefined });
  }

  return (
    <div
      aria-labelledby="team-report-action-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <form
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <h2
          className="text-lg font-bold text-slate-900"
          id="team-report-action-dialog-title"
        >
          {copy.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{copy.description}</p>

        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-700">
          {itemText}
        </p>

        <div className="mt-5 grid gap-4">
          {mode === "create-task" ? (
            <>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Người xử lý
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-600"
                  id="team-report-action-assignee"
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                >
                  <option value="">Chưa gán người xử lý</option>
                  {activeMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName || member.email} ({member.role})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Hạn hoàn thành
                <input
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-600"
                  id="team-report-action-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
            </>
          ) : null}

          {mode === "request-handover" ? (
            <>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Task cần bàn giao
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-600"
                  id="team-report-action-task"
                  required
                  value={taskId}
                  onChange={(event) => setTaskId(event.target.value)}
                >
                  <option value="">Chọn task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.taskCode} - {task.title}
                    </option>
                  ))}
                </select>
                {tasks.length === 0 ? (
                  <span className="text-xs font-normal text-amber-700">
                    Dự án chưa có task nào đang thực hiện để bàn giao.
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Đề xuất người nhận
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-600"
                  id="team-report-action-receiver"
                  required
                  value={suggestedReceiverId}
                  onChange={(event) =>
                    setSuggestedReceiverId(event.target.value)
                  }
                >
                  <option value="">Chọn người nhận</option>
                  {activeMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName || member.email} ({member.role})
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            {mode === "dismiss" ? "Lý do bỏ qua" : "Ghi chú"}
            <textarea
              className="min-h-24 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-600"
              id="team-report-action-note"
              maxLength={2000}
              placeholder="Không bắt buộc"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            id="team-report-action-cancel"
            type="button"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            disabled={isSubmitting || !isValid}
            id="team-report-action-confirm"
            type="submit"
          >
            {isSubmitting ? "Đang xử lý..." : copy.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
