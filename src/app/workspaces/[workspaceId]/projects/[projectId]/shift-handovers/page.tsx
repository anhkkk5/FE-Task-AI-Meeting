"use client";

import { confirmAction } from "@/components/feedback/AppDialogProvider";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { draftHandoverContent } from "@/features/ai-reports/api/ai-reports.api";
import {
  getMyWorkspaceRole,
  getWorkspaceMembers,
} from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import {
  acceptHandover,
  createHandover,
  deleteHandover,
  getHandovers,
  rejectHandover,
  requestHandoverChanges,
  submitHandover,
  updateHandover,
} from "@/features/shift-handovers/api/shift-handovers.api";
import { HandoverReasonModal } from "@/features/shift-handovers/components/HandoverReasonModal";
import { HandoverStatusBadge } from "@/features/shift-handovers/components/HandoverStatusBadge";
import {
  CreateHandoverPayload,
  ShiftHandover,
} from "@/features/shift-handovers/types/shift-handover.type";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

type ListView = "all" | "sent" | "received";

/**
 * Hanh dong dang cho nguoi dung xac nhan trong modal.
 *
 * Giu ca ban giao va loai hanh dong trong mot state de modal biet phai hien tieu
 * de nao va goi API nao, tranh phai them ba cap state rieng.
 */
type PendingAction = {
  handover: ShiftHandover;
  type: "request-changes" | "reject";
};

function localDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function emptyForm(taskId = ""): CreateHandoverPayload {
  return {
    taskId,
    receiverId: "",
    completedWork: "",
    remainingWork: "",
    blockers: "",
    nextSteps: "",
    referenceLinks: "",
    dueAt: localDateTime(),
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "Chưa đặt";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function initials(name?: string | null) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function TaskHandoversPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth(true);
  const requestedTaskId = searchParams.get("taskId") ?? "";
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [myRole, setMyRole] = useState("");
  const [view, setView] = useState<ListView>("all");
  const [showForm, setShowForm] = useState(Boolean(requestedTaskId));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateHandoverPayload>(() =>
    emptyForm(requestedTaskId),
  );
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const canManage = managerRoles.includes(myRole);
  const activeMembers = useMemo(
    () =>
      members.filter(
        (member) => member.status === "ACTIVE" && member.userId !== user?.id,
      ),
    [members, user?.id],
  );
  const eligibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (task.assigneeId ?? task.assignee?.id) === user?.id &&
          (task.status === "IN_PROGRESS" || task.status === "REVIEW"),
      ),
    [tasks, user?.id],
  );
  const filteredHandovers = useMemo(() => {
    if (view === "sent") {
      return handovers.filter((handover) => handover.senderId === user?.id);
    }
    if (view === "received") {
      return handovers.filter((handover) => handover.receiverId === user?.id);
    }
    return handovers;
  }, [handovers, user?.id, view]);
  const pendingForMe = useMemo(
    () =>
      handovers.filter(
        (handover) =>
          handover.receiverId === user?.id && handover.status === "PENDING",
      ).length,
    [handovers, user?.id],
  );
  const sentByMe = useMemo(
    () => handovers.filter((handover) => handover.senderId === user?.id).length,
    [handovers, user?.id],
  );
  const acknowledgedCount = useMemo(
    () =>
      handovers.filter((handover) => handover.status === "ACKNOWLEDGED").length,
    [handovers],
  );

  function report(text: string, failed = false) {
    setMessage(text);
    setIsError(failed);
  }

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const [projectRes, memberRes, roleRes, taskRes, handoverRes] =
        await Promise.all([
          getProjectDetail(params.workspaceId, params.projectId),
          getWorkspaceMembers(params.workspaceId),
          getMyWorkspaceRole(params.workspaceId),
          getTasks(params.workspaceId, params.projectId, {
            page: 1,
            limit: 100,
          }),
          getHandovers(params.workspaceId, params.projectId, {
            page: 1,
            limit: 100,
          }),
        ]);
      setProject(projectRes.data.project);
      setMembers(memberRes.data.items);
      setMyRole(roleRes.data.role);
      setTasks(taskRes.data.items);
      setHandovers(handoverRes.data.items);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách bàn giao.",
      );
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user) void loadData();
  }, [loadData, user]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  /**
   * Nho AI soan noi dung ban giao tu task dang chon.
   *
   * Chi dien vao o dang trong de khong ghi de nhung gi nguoi dung da viet.
   */
  async function handleDraftWithAi() {
    if (!form.taskId) {
      report("Chọn task cần bàn giao trước khi nhờ AI soạn nội dung.", true);
      return;
    }

    setIsDrafting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await draftHandoverContent(
        params.workspaceId,
        params.projectId,
        {
          taskId: form.taskId,
          receiverId: form.receiverId || undefined,
        },
      );
      const draft = response.data.draft;

      setForm((current) => ({
        ...current,
        completedWork: current.completedWork.trim()
          ? current.completedWork
          : draft.completedWork,
        remainingWork: current.remainingWork.trim()
          ? current.remainingWork
          : draft.remainingWork,
        blockers: current.blockers?.trim() ? current.blockers : draft.blockers,
        nextSteps: current.nextSteps?.trim()
          ? current.nextSteps
          : draft.nextSteps,
        referenceLinks: current.referenceLinks?.trim()
          ? current.referenceLinks
          : draft.referenceLinks,
      }));
      report("AI đã soạn bản nháp, bạn kiểm tra lại trước khi gửi.");
    } catch (error) {
      report(
        error instanceof Error
          ? error.message
          : "Không soạn được bản nháp, bạn thử lại sau nhé.",
        true,
      );
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setIsError(false);
    try {
      const payload = {
        ...form,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      };
      const saved = editingId
        ? await updateHandover(params.workspaceId, params.projectId, editingId, {
            receiverId: payload.receiverId,
            completedWork: payload.completedWork,
            remainingWork: payload.remainingWork,
            blockers: payload.blockers,
            nextSteps: payload.nextSteps,
            referenceLinks: payload.referenceLinks,
            dueAt: payload.dueAt,
          })
        : await createHandover(params.workspaceId, params.projectId, payload);

      await submitHandover(
        params.workspaceId,
        params.projectId,
        saved.data.handover.id,
      );
      resetForm();
      setView("sent");
      report("Đã gửi bàn giao cho người nhận.");
      await loadData();
    } catch (error) {
      report(
        error instanceof Error ? error.message : "Gửi bàn giao thất bại.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(handover: ShiftHandover) {
    setEditingId(handover.id);
    setForm({
      taskId: handover.taskId,
      receiverId: handover.receiverId,
      completedWork: handover.completedWork,
      remainingWork: handover.remainingWork,
      blockers: handover.blockers ?? "",
      nextSteps: handover.nextSteps ?? "",
      referenceLinks: handover.referenceLinks ?? "",
      dueAt: handover.dueAt
        ? localDateTime(new Date(handover.dueAt))
        : localDateTime(),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function runAction(
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setIsSaving(true);
    setMessage("");
    setIsError(false);
    try {
      await action();
      report(successMessage);
      await loadData();
    } catch (error) {
      report(
        error instanceof Error ? error.message : "Thao tác thất bại.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAccept(handover: ShiftHandover) {
    if (
      !await confirmAction({
        title: "Tiếp nhận bàn giao",
        description: `Bạn sẽ trở thành người phụ trách ${handover.task?.taskCode ?? "công việc"} và tiếp tục xử lý công việc này.`,
        confirmLabel: "Tiếp nhận",
        tone: "success",
      })
    ) {
      return;
    }
    void runAction(
      () => acceptHandover(params.workspaceId, params.projectId, handover.id),
      "Đã tiếp nhận công việc và cập nhật người phụ trách.",
    );
  }

  /** Xu ly ket qua modal cho ca hai hanh dong can ly do. */
  function handleReasonConfirm(reason: string) {
    if (!pendingAction) return;
    const { handover, type } = pendingAction;
    setPendingAction(null);

    if (type === "request-changes") {
      void runAction(
        () =>
          requestHandoverChanges(
            params.workspaceId,
            params.projectId,
            handover.id,
            reason,
          ),
        "Đã gửi yêu cầu bổ sung.",
      );
      return;
    }

    void runAction(
      () =>
        rejectHandover(
          params.workspaceId,
          params.projectId,
          handover.id,
          reason,
        ),
      "Đã từ chối bàn giao.",
    );
  }

  async function handleDelete(handover: ShiftHandover) {
    if (!await confirmAction({ title: "Xóa bàn giao", description: `Bàn giao “${handover.title}” sẽ bị xóa.`, confirmLabel: "Xóa bàn giao", tone: "danger" })) return;
    void runAction(
      () => deleteHandover(params.workspaceId, params.projectId, handover.id),
      "Đã xóa bàn giao.",
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">
        Đang tải...
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Chờ tôi xử lý",
      value: pendingForMe,
      hint: "Bàn giao đang chờ bạn phản hồi",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
    },
    {
      label: "Tôi đã giao",
      value: sentByMe,
      hint: "Bàn giao do bạn tạo",
      tone: "border-brand-200 bg-brand-50 text-brand-700",
    },
    {
      label: "Đã tiếp nhận",
      value: acknowledgedCount,
      hint: "Đã chuyển người phụ trách",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-7xl space-y-5 pb-12">
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Nghiệp vụ bàn giao và giao ban">
          <span className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">
            Bàn giao công việc
          </span>
          <Link
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/me`}
          >
            Giao ban của tôi
          </Link>
          {canManage ? (
            <Link
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team`}
            >
              Báo cáo giao ban team
            </Link>
          ) : null}
        </nav>

        <header className="rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                Công việc
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Bàn giao công việc
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Chuyển giao đầy đủ bối cảnh và chỉ đổi người phụ trách sau khi
                người nhận đồng ý.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                disabled={isLoading}
                id="handover-refresh-button"
                onClick={() => void loadData()}
                type="button"
              >
                Làm mới
              </button>
              <button
                className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
                id="handover-toggle-form-button"
                onClick={() => {
                  if (showForm) resetForm();
                  else setShowForm(true);
                }}
                type="button"
              >
                {showForm ? "Đóng" : "+ Tạo bàn giao"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                className={`rounded-xl border px-4 py-3 ${card.tone}`}
                key={card.label}
              >
                <p className="text-xs font-bold uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
                <p className="mt-0.5 text-[11px] font-medium opacity-80">
                  {card.hint}
                </p>
              </div>
            ))}
          </div>
        </header>

        {message ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              isError
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role="status"
          >
            {message}
          </div>
        ) : null}

        {showForm ? (
          <form
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            onSubmit={handleSave}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Bổ sung bàn giao" : "Tạo bàn giao mới"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chỉ các task bạn đang phụ trách và đang thực hiện mới có thể
                  bàn giao.
                </p>
              </div>
              <button
                className="h-10 shrink-0 rounded-xl border border-brand-600 bg-white px-4 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                disabled={isDrafting || !form.taskId}
                id="handover-ai-draft-button"
                onClick={handleDraftWithAi}
                type="button"
              >
                {isDrafting ? "Đang soạn..." : "AI soạn nội dung bàn giao"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Công việc
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-600 disabled:bg-slate-100"
                  disabled={Boolean(editingId)}
                  onChange={(event) =>
                    setForm({ ...form, taskId: event.target.value })
                  }
                  required
                  value={form.taskId}
                >
                  <option value="">Chọn task cần bàn giao</option>
                  {eligibleTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.taskCode} - {task.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Người nhận
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-600"
                  onChange={(event) =>
                    setForm({ ...form, receiverId: event.target.value })
                  }
                  required
                  value={form.receiverId}
                >
                  <option value="">Chọn người nhận</option>
                  {activeMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName || member.email} ({member.role})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Phần đã hoàn thành
                <textarea
                  className="min-h-28 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-600"
                  maxLength={5000}
                  onChange={(event) =>
                    setForm({ ...form, completedWork: event.target.value })
                  }
                  placeholder="Kết quả đã làm, trạng thái hiện tại..."
                  required
                  value={form.completedWork}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Phần còn lại
                <textarea
                  className="min-h-28 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-600"
                  maxLength={5000}
                  onChange={(event) =>
                    setForm({ ...form, remainingWork: event.target.value })
                  }
                  placeholder="Việc chưa hoàn thành và kết quả mong đợi..."
                  required
                  value={form.remainingWork}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Vướng mắc
                <textarea
                  className="min-h-24 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-600"
                  onChange={(event) =>
                    setForm({ ...form, blockers: event.target.value })
                  }
                  placeholder="Rủi ro, phụ thuộc hoặc vấn đề đang chặn..."
                  value={form.blockers}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Bước tiếp theo
                <textarea
                  className="min-h-24 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-600"
                  onChange={(event) =>
                    setForm({ ...form, nextSteps: event.target.value })
                  }
                  placeholder="Việc người nhận nên thực hiện đầu tiên..."
                  value={form.nextSteps}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Liên kết tài liệu
                <textarea
                  className="min-h-24 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-600"
                  onChange={(event) =>
                    setForm({ ...form, referenceLinks: event.target.value })
                  }
                  placeholder="Mỗi liên kết một dòng"
                  value={form.referenceLinks}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Hạn xử lý dự kiến
                <input
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-brand-600"
                  onChange={(event) =>
                    setForm({ ...form, dueAt: event.target.value })
                  }
                  type="datetime-local"
                  value={form.dueAt ?? ""}
                />
              </label>
            </div>

            {eligibleTasks.length === 0 && !editingId ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Bạn chưa có task nào ở trạng thái “Đang thực hiện” hoặc “Đang
                duyệt”.
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={resetForm}
                type="button"
              >
                Hủy
              </button>
              <button
                className="h-10 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                disabled={isSaving || (!editingId && eligibleTasks.length === 0)}
                type="submit"
              >
                {isSaving ? "Đang gửi..." : "Gửi bàn giao"}
              </button>
            </div>
          </form>
        ) : null}

        <nav
          aria-label="Lọc danh sách bàn giao"
          className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm"
        >
          {(
            [
              ["all", `Tất cả (${handovers.length})`],
              [
                "received",
                `Tôi nhận${pendingForMe ? ` (${pendingForMe} chờ)` : ""}`,
              ],
              ["sent", `Tôi đã giao (${sentByMe})`],
            ] as [ListView, string][]
          ).map(([value, label]) => (
            <button
              className={`h-10 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition ${
                view === value
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              key={value}
              onClick={() => setView(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
          </div>
        ) : filteredHandovers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <p className="text-base font-bold text-slate-900">
              Chưa có bàn giao nào
            </p>
            <p className="mt-1.5 text-sm text-slate-500">
              Bàn giao được tạo từ một task đang thực hiện hoặc đang duyệt.
            </p>
          </div>
        ) : (
          <section aria-label="Danh sách bàn giao" className="space-y-4">
            {filteredHandovers.map((handover) => {
              const isSender = handover.senderId === user?.id;
              const isReceiver = handover.receiverId === user?.id;
              const canEdit =
                isSender &&
                (handover.status === "DRAFT" ||
                  handover.status === "CHANGES_REQUESTED");
              const links = (handover.referenceLinks ?? "")
                .split(/\r?\n/)
                .map((link) => link.trim())
                .filter(Boolean);

              return (
                <article
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md"
                  key={handover.id}
                >
                  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="font-mono text-xs font-bold text-brand-700 transition hover:text-brand-600 hover:underline"
                          href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${handover.taskId}`}
                        >
                          {handover.task?.taskCode ?? "TASK"}
                        </Link>
                        <HandoverStatusBadge status={handover.status} />
                      </div>
                      <h2 className="mt-1.5 truncate text-base font-bold text-slate-900">
                        {handover.task?.title ?? handover.title}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                          {initials(handover.sender?.fullName)}
                        </span>
                        {handover.sender?.fullName ?? "Người giao"}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        →
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                          {initials(handover.receiver?.fullName)}
                        </span>
                        {handover.receiver?.fullName ?? "Người nhận"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50/80 p-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Đã hoàn thành
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                        {handover.completedWork}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50/80 p-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Còn lại
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                        {handover.remainingWork}
                      </p>
                    </div>
                    {handover.blockers ? (
                      <div className="rounded-xl bg-amber-50/70 p-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
                          Vướng mắc
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {handover.blockers}
                        </p>
                      </div>
                    ) : null}
                    {handover.nextSteps ? (
                      <div className="rounded-xl bg-brand-50/70 p-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                          Bước tiếp theo
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {handover.nextSteps}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {handover.changeRequest || handover.rejectionReason ? (
                    <div className="mx-5 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Phản hồi:{" "}
                      {handover.changeRequest ?? handover.rejectionReason}
                    </div>
                  ) : null}

                  {links.length ? (
                    <div className="mx-5 mb-4 rounded-xl border border-slate-200 px-4 py-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Tài liệu liên quan
                      </h3>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {links.map((url) => (
                          <a
                            className="break-all text-sm font-semibold text-brand-700 transition hover:text-brand-600 hover:underline"
                            href={url}
                            key={url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-xs font-medium text-slate-500">
                      <span>Hạn dự kiến: {formatDateTime(handover.dueAt)}</span>
                      <span className="mx-2">·</span>
                      <span>Tạo lúc {formatDateTime(handover.createdAt)}</span>
                      {links.length ? (
                        <span className="ml-2">
                          · {links.length} liên kết tài liệu
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canEdit ? (
                        <button
                          className="h-9 rounded-lg border border-slate-300 px-3.5 text-xs font-bold text-slate-700 transition hover:bg-white"
                          onClick={() => startEditing(handover)}
                          type="button"
                        >
                          {handover.status === "CHANGES_REQUESTED"
                            ? "Bổ sung"
                            : "Tiếp tục"}
                        </button>
                      ) : null}
                      {isReceiver && handover.status === "PENDING" ? (
                        <>
                          <button
                            className="h-9 rounded-lg border border-slate-300 px-3.5 text-xs font-bold text-slate-700 transition hover:bg-white disabled:opacity-50"
                            disabled={isSaving}
                            onClick={() =>
                              setPendingAction({
                                handover,
                                type: "request-changes",
                              })
                            }
                            type="button"
                          >
                            Yêu cầu bổ sung
                          </button>
                          <button
                            className="h-9 rounded-lg border border-rose-300 px-3.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            disabled={isSaving}
                            onClick={() =>
                              setPendingAction({ handover, type: "reject" })
                            }
                            type="button"
                          >
                            Từ chối
                          </button>
                          <button
                            className="h-9 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                            disabled={isSaving}
                            onClick={() => handleAccept(handover)}
                            type="button"
                          >
                            Tiếp nhận
                          </button>
                        </>
                      ) : null}
                      {isSender || canManage ? (
                        <button
                          aria-label={`Xóa bàn giao ${handover.title}`}
                          className="h-9 rounded-lg border border-slate-300 px-3.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                          disabled={isSaving}
                          onClick={() => handleDelete(handover)}
                          type="button"
                        >
                          Xóa
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {pendingAction ? (
        <HandoverReasonModal
          confirmLabel={
            pendingAction.type === "request-changes"
              ? "Gửi yêu cầu"
              : "Từ chối bàn giao"
          }
          description={
            pendingAction.type === "request-changes"
              ? `Người giao sẽ nhận được yêu cầu này và bổ sung lại ${pendingAction.handover.task?.taskCode ?? "task"}.`
              : `Bàn giao ${pendingAction.handover.task?.taskCode ?? "task"} sẽ bị từ chối và người phụ trách không thay đổi.`
          }
          isSubmitting={isSaving}
          label={
            pendingAction.type === "request-changes"
              ? "Nội dung cần bổ sung"
              : "Lý do từ chối"
          }
          onCancel={() => setPendingAction(null)}
          onConfirm={handleReasonConfirm}
          placeholder={
            pendingAction.type === "request-changes"
              ? "Ví dụ: thiếu thông tin về cấu hình môi trường staging..."
              : "Ví dụ: tôi đang quá tải, đề nghị giao cho người khác..."
          }
          title={
            pendingAction.type === "request-changes"
              ? "Yêu cầu bổ sung thông tin"
              : "Từ chối nhận bàn giao"
          }
          tone={pendingAction.type === "reject" ? "danger" : "brand"}
        />
      ) : null}
    </AppShell>
  );
}
