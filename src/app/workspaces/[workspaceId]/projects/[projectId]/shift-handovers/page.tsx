"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
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
import {
  CreateHandoverPayload,
  HandoverStatus,
  ShiftHandover,
} from "@/features/shift-handovers/types/shift-handover.type";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

const statusLabels: Record<HandoverStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING: "Chờ người nhận",
  CHANGES_REQUESTED: "Cần bổ sung",
  ACKNOWLEDGED: "Đã tiếp nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
};

const statusStyles: Record<HandoverStatus, string> = {
  DRAFT: "bg-[#f1f2f4] text-[#44546f]",
  PENDING: "bg-[#fff7d6] text-[#7f5f01]",
  CHANGES_REQUESTED: "bg-[#ffedeb] text-[#ae2a19]",
  ACKNOWLEDGED: "bg-[#dcfff1] text-[#216e4e]",
  REJECTED: "bg-[#ffedeb] text-[#ae2a19]",
  CANCELLED: "bg-[#f1f2f4] text-[#626f86]",
};

type ListView = "all" | "sent" | "received";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
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

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      };
      const saved = editingId
        ? await updateHandover(
            params.workspaceId,
            params.projectId,
            editingId,
            {
              receiverId: payload.receiverId,
              completedWork: payload.completedWork,
              remainingWork: payload.remainingWork,
              blockers: payload.blockers,
              nextSteps: payload.nextSteps,
              referenceLinks: payload.referenceLinks,
              dueAt: payload.dueAt,
            },
          )
        : await createHandover(
            params.workspaceId,
            params.projectId,
            payload,
          );

      await submitHandover(
        params.workspaceId,
        params.projectId,
        saved.data.handover.id,
      );
      resetForm();
      setView("sent");
      setMessage("Đã gửi bàn giao cho người nhận.");
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gửi bàn giao thất bại.",
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
    try {
      await action();
      setMessage(successMessage);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAccept(handover: ShiftHandover) {
    if (
      !window.confirm(
        `Tiếp nhận ${handover.task?.taskCode ?? "task"}? Bạn sẽ trở thành người phụ trách công việc này.`,
      )
    ) {
      return;
    }
    void runAction(
      () =>
        acceptHandover(
          params.workspaceId,
          params.projectId,
          handover.id,
        ),
      "Đã tiếp nhận công việc và cập nhật người phụ trách.",
    );
  }

  function handleRequestChanges(handover: ShiftHandover) {
    const reason = window.prompt("Nội dung người giao cần bổ sung:")?.trim();
    if (!reason) return;
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
  }

  function handleReject(handover: ShiftHandover) {
    const reason = window.prompt("Lý do từ chối nhận bàn giao:")?.trim();
    if (!reason) return;
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

  function handleDelete(handover: ShiftHandover) {
    if (!window.confirm(`Xóa bàn giao “${handover.title}”?`)) return;
    void runAction(
      () =>
        deleteHandover(
          params.workspaceId,
          params.projectId,
          handover.id,
        ),
      "Đã xóa bàn giao.",
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Đang tải...
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-7xl space-y-4 pb-12">
        <header className="border border-[#dfe1e6] bg-white px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#0c66e4]">
                Công việc
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#172b4d]">
                Bàn giao công việc
              </h1>
              <p className="mt-1 text-sm text-[#6b778c]">
                Chuyển giao đầy đủ bối cảnh và chỉ đổi người phụ trách sau khi
                người nhận đồng ý.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="h-9 border border-[#dfe1e6] px-3 text-sm font-medium hover:bg-[#f1f2f4]"
                disabled={isLoading}
                onClick={() => void loadData()}
                type="button"
              >
                Làm mới
              </button>
              <button
                className="h-9 bg-[#0c66e4] px-3 text-sm font-semibold text-white hover:bg-[#0055cc]"
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
        </header>

        {message ? (
          <div className="border border-[#f5cd47] bg-[#fff7d6] px-4 py-3 text-sm text-[#7f5f01]">
            {message}
          </div>
        ) : null}

        {showForm ? (
          <form
            className="border border-[#dfe1e6] bg-white p-5"
            onSubmit={handleSave}
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#172b4d]">
                {editingId ? "Bổ sung bàn giao" : "Tạo bàn giao mới"}
              </h2>
              <p className="mt-1 text-sm text-[#6b778c]">
                Chỉ các task bạn đang phụ trách và đang thực hiện mới có thể
                bàn giao.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-[#172b4d]">
                Công việc
                <select
                  className="mt-1 h-10 w-full border border-[#dfe1e6] bg-white px-3 font-normal outline-none focus:border-[#0c66e4] disabled:bg-[#f1f2f4]"
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
              <label className="text-sm font-medium text-[#172b4d]">
                Người nhận
                <select
                  className="mt-1 h-10 w-full border border-[#dfe1e6] bg-white px-3 font-normal outline-none focus:border-[#0c66e4]"
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
              <label className="text-sm font-medium text-[#172b4d]">
                Phần đã hoàn thành
                <textarea
                  className="mt-1 min-h-28 w-full resize-y border border-[#dfe1e6] p-3 font-normal outline-none focus:border-[#0c66e4]"
                  maxLength={5000}
                  onChange={(event) =>
                    setForm({ ...form, completedWork: event.target.value })
                  }
                  placeholder="Kết quả đã làm, trạng thái hiện tại..."
                  required
                  value={form.completedWork}
                />
              </label>
              <label className="text-sm font-medium text-[#172b4d]">
                Phần còn lại
                <textarea
                  className="mt-1 min-h-28 w-full resize-y border border-[#dfe1e6] p-3 font-normal outline-none focus:border-[#0c66e4]"
                  maxLength={5000}
                  onChange={(event) =>
                    setForm({ ...form, remainingWork: event.target.value })
                  }
                  placeholder="Việc chưa hoàn thành và kết quả mong đợi..."
                  required
                  value={form.remainingWork}
                />
              </label>
              <label className="text-sm font-medium text-[#172b4d]">
                Vướng mắc
                <textarea
                  className="mt-1 min-h-20 w-full resize-y border border-[#dfe1e6] p-3 font-normal outline-none focus:border-[#0c66e4]"
                  onChange={(event) =>
                    setForm({ ...form, blockers: event.target.value })
                  }
                  placeholder="Rủi ro, phụ thuộc hoặc vấn đề đang chặn..."
                  value={form.blockers}
                />
              </label>
              <label className="text-sm font-medium text-[#172b4d]">
                Bước tiếp theo
                <textarea
                  className="mt-1 min-h-20 w-full resize-y border border-[#dfe1e6] p-3 font-normal outline-none focus:border-[#0c66e4]"
                  onChange={(event) =>
                    setForm({ ...form, nextSteps: event.target.value })
                  }
                  placeholder="Việc người nhận nên thực hiện đầu tiên..."
                  value={form.nextSteps}
                />
              </label>
              <label className="text-sm font-medium text-[#172b4d]">
                Liên kết tài liệu
                <textarea
                  className="mt-1 min-h-20 w-full resize-y border border-[#dfe1e6] p-3 font-normal outline-none focus:border-[#0c66e4]"
                  onChange={(event) =>
                    setForm({ ...form, referenceLinks: event.target.value })
                  }
                  placeholder="Mỗi liên kết một dòng"
                  value={form.referenceLinks}
                />
              </label>
              <label className="text-sm font-medium text-[#172b4d]">
                Hạn xử lý dự kiến
                <input
                  className="mt-1 h-10 w-full border border-[#dfe1e6] px-3 font-normal outline-none focus:border-[#0c66e4]"
                  onChange={(event) =>
                    setForm({ ...form, dueAt: event.target.value })
                  }
                  type="datetime-local"
                  value={form.dueAt ?? ""}
                />
              </label>
            </div>
            {eligibleTasks.length === 0 && !editingId ? (
              <p className="mt-4 text-sm text-[#ae2a19]">
                Bạn chưa có task nào ở trạng thái “Đang thực hiện” hoặc “Đang
                duyệt”.
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-9 border border-[#dfe1e6] px-4 text-sm font-medium hover:bg-[#f1f2f4]"
                onClick={resetForm}
                type="button"
              >
                Hủy
              </button>
              <button
                className="h-9 bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] disabled:bg-[#b3b9c4]"
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
          className="flex overflow-x-auto border-b border-[#dfe1e6] bg-white px-3"
        >
          {(
            [
              ["all", `Tất cả (${handovers.length})`],
              [
                "received",
                `Tôi nhận${pendingForMe ? ` (${pendingForMe} chờ)` : ""}`,
              ],
              ["sent", "Tôi đã giao"],
            ] as [ListView, string][]
          ).map(([value, label]) => (
            <button
              className={`h-11 whitespace-nowrap border-b-2 px-4 text-sm font-medium ${
                view === value
                  ? "border-[#0c66e4] text-[#0c66e4]"
                  : "border-transparent text-[#44546f]"
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
          <div className="border border-[#dfe1e6] bg-white p-8 text-center text-sm text-[#6b778c]">
            Đang tải danh sách...
          </div>
        ) : filteredHandovers.length === 0 ? (
          <div className="border border-dashed border-[#b3b9c4] bg-white p-10 text-center">
            <p className="font-semibold text-[#172b4d]">Chưa có bàn giao nào</p>
            <p className="mt-1 text-sm text-[#6b778c]">
              Bàn giao được tạo từ một task đang thực hiện hoặc đang duyệt.
            </p>
          </div>
        ) : (
          <section className="space-y-3" aria-label="Danh sách bàn giao">
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
                  className="border border-[#dfe1e6] bg-white"
                  key={handover.id}
                >
                  <div className="flex flex-col gap-4 border-b border-[#dfe1e6] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="font-mono text-xs font-semibold text-[#0c66e4] hover:underline"
                          href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${handover.taskId}`}
                        >
                          {handover.task?.taskCode ?? "TASK"}
                        </Link>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold ${statusStyles[handover.status]}`}
                        >
                          {statusLabels[handover.status]}
                        </span>
                      </div>
                      <h2 className="mt-1 truncate font-semibold text-[#172b4d]">
                        {handover.task?.title ?? handover.title}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#44546f]">
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#deebff] text-xs font-bold text-[#0747a6]">
                          {initials(handover.sender?.fullName)}
                        </span>
                        {handover.sender?.fullName ?? "Người giao"}
                      </span>
                      <span aria-hidden="true">→</span>
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dcfff1] text-xs font-bold text-[#216e4e]">
                          {initials(handover.receiver?.fullName)}
                        </span>
                        {handover.receiver?.fullName ?? "Người nhận"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-px bg-[#dfe1e6] md:grid-cols-2">
                    <div className="bg-white p-4">
                      <h3 className="text-xs font-semibold uppercase text-[#6b778c]">
                        Đã hoàn thành
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#172b4d]">
                        {handover.completedWork}
                      </p>
                    </div>
                    <div className="bg-white p-4">
                      <h3 className="text-xs font-semibold uppercase text-[#6b778c]">
                        Còn lại
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#172b4d]">
                        {handover.remainingWork}
                      </p>
                    </div>
                    {handover.blockers ? (
                      <div className="bg-white p-4">
                        <h3 className="text-xs font-semibold uppercase text-[#6b778c]">
                          Vướng mắc
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[#172b4d]">
                          {handover.blockers}
                        </p>
                      </div>
                    ) : null}
                    {handover.nextSteps ? (
                      <div className="bg-white p-4">
                        <h3 className="text-xs font-semibold uppercase text-[#6b778c]">
                          Bước tiếp theo
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[#172b4d]">
                          {handover.nextSteps}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {handover.changeRequest || handover.rejectionReason ? (
                    <div className="border-t border-[#f5cd47] bg-[#fff7d6] px-4 py-3 text-sm text-[#7f5f01]">
                      <strong>Phản hồi:</strong>{" "}
                      {handover.changeRequest ?? handover.rejectionReason}
                    </div>
                  ) : null}

                  {links.length ? (
                    <div className="border-t border-[#dfe1e6] bg-white px-4 py-3">
                      <h3 className="text-xs font-semibold uppercase text-[#6b778c]">
                        Tài liệu liên quan
                      </h3>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {links.map((url) => (
                          <a
                            className="break-all text-sm text-[#0c66e4] hover:underline"
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

                  <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-xs text-[#6b778c]">
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
                          className="h-8 border border-[#dfe1e6] px-3 text-xs font-semibold hover:bg-[#f1f2f4]"
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
                            className="h-8 border border-[#dfe1e6] px-3 text-xs font-semibold hover:bg-[#f1f2f4]"
                            disabled={isSaving}
                            onClick={() => handleRequestChanges(handover)}
                            type="button"
                          >
                            Yêu cầu bổ sung
                          </button>
                          <button
                            className="h-8 border border-[#ae2a19] px-3 text-xs font-semibold text-[#ae2a19] hover:bg-[#fff4f2]"
                            disabled={isSaving}
                            onClick={() => handleReject(handover)}
                            type="button"
                          >
                            Từ chối
                          </button>
                          <button
                            className="h-8 bg-[#216e4e] px-3 text-xs font-semibold text-white hover:bg-[#1f845a]"
                            disabled={isSaving}
                            onClick={() => handleAccept(handover)}
                            type="button"
                          >
                            Tiếp nhận
                          </button>
                        </>
                      ) : null}
                      {(isSender || canManage) ? (
                        <button
                          aria-label={`Xóa bàn giao ${handover.title}`}
                          className="h-8 border border-[#dfe1e6] px-3 text-xs font-semibold text-[#ae2a19] hover:bg-[#fff4f2]"
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
    </AppShell>
  );
}
