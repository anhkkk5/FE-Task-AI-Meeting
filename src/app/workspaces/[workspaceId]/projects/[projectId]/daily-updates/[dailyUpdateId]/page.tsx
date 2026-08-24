"use client";

import { confirmAction } from "@/components/feedback/AppDialogProvider";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  archiveDailyUpdate,
  getDailyUpdateDetail,
  updateDailyUpdate,
} from "@/features/daily-updates/api/daily-updates.api";
import { DailyUpdateCard } from "@/features/daily-updates/components/DailyUpdateCard";
import { DailyUpdateForm } from "@/features/daily-updates/components/DailyUpdateForm";
import {
  CreateDailyUpdatePayload,
  DailyUpdate,
  UpdateDailyUpdatePayload,
} from "@/features/daily-updates/types/daily-update.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

export default function DailyUpdateDetailPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    dailyUpdateId: string;
  }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [dailyUpdate, setDailyUpdate] = useState<DailyUpdate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const canEdit = Boolean(user && dailyUpdate?.userId === user.id);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, dailyUpdateRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
        getDailyUpdateDetail(
          params.workspaceId,
          params.projectId,
          params.dailyUpdateId,
        ),
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setDailyUpdate(dailyUpdateRes.data.dailyUpdate);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tải chi tiết daily update thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.dailyUpdateId, params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.dailyUpdateId) {
      void loadData();
    }
  }, [
    user,
    params.workspaceId,
    params.projectId,
    params.dailyUpdateId,
    loadData,
  ]);

  async function handleUpdate(
    payload: CreateDailyUpdatePayload | UpdateDailyUpdatePayload,
  ) {
    if (!dailyUpdate) return;

    try {
      const response = await updateDailyUpdate(
        params.workspaceId,
        params.projectId,
        dailyUpdate.id,
        payload as UpdateDailyUpdatePayload,
      );
      setDailyUpdate(response.data.dailyUpdate);
      setIsEditing(false);
      setMessage("Đã cập nhật daily update.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Cập nhật daily update thất bại.",
      );
    }
  }

  async function handleArchive() {
    if (!dailyUpdate) return;
    const confirmed = await confirmAction({ title: "Lưu trữ cập nhật hằng ngày", description: "Bản cập nhật sẽ được lưu trữ bằng cơ chế xóa mềm và không còn xuất hiện trong danh sách chính.", confirmLabel: "Lưu trữ", tone: "warning" });

    if (!confirmed) return;

    setIsArchiving(true);
    try {
      await archiveDailyUpdate(
        params.workspaceId,
        params.projectId,
        dailyUpdate.id,
      );
      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/me`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Archive daily update thất bại.",
      );
    } finally {
      setIsArchiving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Daily detail
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Chi tiết daily update
              </h1>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {dailyUpdate?.user?.fullName ?? "Thành viên"} ·{" "}
                {dailyUpdate?.updateDate ?? "-"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/me`}
              >
                Của tôi
              </Link>
              {canEdit ? (
                <>
                  <button
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                    type="button"
                    onClick={() => setIsEditing((value) => !value)}
                  >
                    {isEditing ? "Đóng form sửa" : "Sửa"}
                  </button>
                  <button
                    className="h-10 rounded-xl bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:bg-zinc-400"
                    disabled={isArchiving}
                    type="button"
                    onClick={() => void handleArchive()}
                  >
                    {isArchiving ? "Đang archive..." : "Archive"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : dailyUpdate ? (
          <>
            <DailyUpdateCard
              dailyUpdate={dailyUpdate}
              projectId={params.projectId}
              workspaceId={params.workspaceId}
            />

            {dailyUpdate.notes ? (
              <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Ghi chú
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                  {dailyUpdate.notes}
                </p>
              </section>
            ) : null}

            {canEdit && isEditing ? (
              <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-black text-zinc-950">
                  Cập nhật daily update
                </h2>
                <DailyUpdateForm
                  initialDailyUpdate={dailyUpdate}
                  projectId={params.projectId}
                  sprints={sprints}
                  submitLabel="Cập nhật"
                  workspaceId={params.workspaceId}
                  onSubmit={handleUpdate}
                />
              </section>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
            Không tìm thấy daily update.
          </div>
        )}
      </div>
    </AppShell>
  );
}
