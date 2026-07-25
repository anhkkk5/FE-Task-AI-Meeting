import { TaskStatus } from "@/features/tasks/types/task.type";
import { MyWorkTask } from "../types/my-work.type";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  REVIEW: "Đang review",
  DONE: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export const STATUS_STYLE: Record<TaskStatus, string> = {
  BACKLOG: "bg-slate-50 text-slate-600 border-slate-200",
  TODO: "bg-sky-50 text-sky-700 border-sky-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  REVIEW: "bg-violet-50 text-violet-700 border-violet-200",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

/** Cac trang thai duoc coi la "con phai lam". */
export const OPEN_STATUSES: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
];

export function formatDueDate(value: string | null) {
  if (!value) return "Không có hạn";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Task qua han: con mo va dueDate truoc dau ngay hom nay. */
export function isOverdue(task: MyWorkTask) {
  if (!task.dueDate) return false;
  if (!OPEN_STATUSES.includes(task.status)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(task.dueDate) < today;
}
