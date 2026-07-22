"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import {
  cancelSprint,
  completeSprint,
  deleteSprint,
  getSprintDetail,
  startSprint,
} from "@/features/sprints/api/sprints.api";
import { SprintStatusBadge } from "@/features/sprints/components/SprintStatusBadge";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("vi-VN");
}

export default function SprintDetailPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    sprintId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const canWrite =
    writeRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadSprint = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectResponse, sprintResponse, roleResponse] =
          await Promise.all([
            getProjectDetail(params.workspaceId, params.projectId),
            getSprintDetail(
              params.workspaceId,
              params.projectId,
              params.sprintId,
            ),
            getMyWorkspaceRole(params.workspaceId),
          ]);
        setProject(projectResponse.data.project);
        setSprint(sprintResponse.data.sprint);
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Tải chi tiết sprint thất bại.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [params.projectId, params.sprintId, params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.sprintId) {
      void loadSprint();
    }
  }, [
    user,
    params.workspaceId,
    params.projectId,
    params.sprintId,
    loadSprint,
  ]);

  async function handleStart() {
    if (!sprint) return;
    setActionBusy(true);
    setMessage("");

    try {
      const response = await startSprint(
        params.workspaceId,
        params.projectId,
        sprint.id,
      );
      setSprint(response.data.sprint);
      setMessage("Sprint đã được bắt đầu.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Bắt đầu sprint thất bại.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleComplete() {
    if (!sprint) return;
    if (!confirm("Xác nhận hoàn thành sprint này?")) return;
    setActionBusy(true);
    setMessage("");

    try {
      const response = await completeSprint(
        params.workspaceId,
        params.projectId,
        sprint.id,
      );
      setSprint(response.data.sprint);
      setMessage("Sprint đã được đánh dấu hoàn thành.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Hoàn thành sprint thất bại.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCancel() {
    if (!sprint) return;
    if (!confirm("Xác nhận hủy sprint này?")) return;
    setActionBusy(true);
    setMessage("");

    try {
      await cancelSprint(params.workspaceId, params.projectId, sprint.id);
      setMessage("Sprint đã được hủy.");
      await loadSprint();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Hủy sprint thất bại.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete() {
    if (!sprint) return;
    if (!confirm(`Xóa sprint "${sprint.name}"? Các task sẽ được đưa về Backlog.`)) {
      return;
    }
    setActionBusy(true);
    setMessage("");

    try {
      await deleteSprint(params.workspaceId, params.projectId, sprint.id);
      router.replace(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa sprint thất bại.");
      setActionBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  const canStart = canWrite && sprint?.status === "PLANNED";
  const canComplete = canWrite && sprint?.status === "ACTIVE";
  const canCancel =
    canWrite && (sprint?.status === "PLANNED" || sprint?.status === "ACTIVE");
  const canDelete = Boolean(
    sprint &&
      sprint.status !== "ACTIVE" &&
      (canWrite || sprint.createdBy === user?.id),
  );

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Sprint detail
              </p>
              <h1 className="mt-1 text-xl font-bold text-zinc-900">
                {sprint?.name ?? "Chi tiết Sprint"}
              </h1>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {project?.name ?? "Dự án"} {myRole ? `· Vai trò: ${myRole}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints`}
              >
                Danh sách sprint
              </Link>
              <Link
                className="flex h-9 items-center rounded-lg border border-sky-200 bg-sky-50 px-4 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/${params.sprintId}/board`}
              >
                Board
              </Link>
              {sprint?.status === "PLANNED" && canWrite ? (
                <Link
                  className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/${params.sprintId}/settings`}
                >
                  Chỉnh sửa
                </Link>
              ) : null}
              <button
                className="h-9 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                disabled={isLoading || actionBusy}
                type="button"
                onClick={() => void loadSprint()}
              >
                Làm mới
              </button>
              {canDelete ? (
                <button
                  className="h-9 rounded-lg border border-red-200 bg-white px-4 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  disabled={actionBusy}
                  onClick={() => void handleDelete()}
                  type="button"
                >
                  Xóa sprint
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : sprint ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-mono text-zinc-400">
                    Sprint ID: {sprint.id}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-zinc-950">
                    {sprint.name}
                  </h2>
                </div>
                <SprintStatusBadge status={sprint.status} />
              </div>

              <div className="mt-6 border-t border-zinc-100 pt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Mục tiêu Sprint
                </h3>
                <p className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 text-sm leading-7 text-zinc-700">
                  {sprint.goal || "Sprint này chưa có mục tiêu cụ thể."}
                </p>
              </div>

              <dl className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Bắt đầu
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-zinc-800">
                    {formatDate(sprint.startDate)}
                  </dd>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Kết thúc
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-zinc-800">
                    {formatDate(sprint.endDate)}
                  </dd>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Started at
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-zinc-800">
                    {formatDateTime(sprint.startedAt)}
                  </dd>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Completed at
                  </dt>
                  <dd className="mt-1 text-xs font-semibold text-zinc-800">
                    {formatDateTime(sprint.completedAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900">
                  Trạng thái thao tác
                </h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Start chỉ áp dụng cho PLANNED, complete chỉ áp dụng cho
                  ACTIVE, cancel áp dụng cho PLANNED hoặc ACTIVE.
                </p>
                <div className="mt-4 grid gap-2">
                  <button
                    className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    disabled={!canStart || actionBusy}
                    type="button"
                    onClick={() => void handleStart()}
                  >
                    Start sprint
                  </button>
                  <button
                    className="h-10 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    disabled={!canComplete || actionBusy}
                    type="button"
                    onClick={() => void handleComplete()}
                  >
                    Complete sprint
                  </button>
                  <button
                    className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                    disabled={!canCancel || actionBusy}
                    type="button"
                    onClick={() => void handleCancel()}
                  >
                    Cancel sprint
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900">Thông tin</h3>
                <dl className="mt-4 space-y-3 text-xs">
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-zinc-400">
                      Người tạo
                    </dt>
                    <dd className="mt-1 break-all font-semibold text-zinc-700">
                      {sprint.createdBy}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-wider text-zinc-400">
                      Created at
                    </dt>
                    <dd className="mt-1 font-semibold text-zinc-700">
                      {formatDateTime(sprint.createdAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center shadow-sm">
            <p className="text-sm font-semibold text-zinc-600">
              Không tìm thấy sprint.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
