"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  archiveProject,
  completeProject,
  getProjectDetail,
  updateProject,
} from "@/features/projects/api/projects.api";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectSettingsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadProject = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await getProjectDetail(
          params.workspaceId,
          params.projectId,
        );
        setProject(response.data.project);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải cấu hình dự án thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [params.projectId, params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadProject();
    }
  }, [user, params.workspaceId, params.projectId, loadProject]);

  async function handleUpdate(payload: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const response = await updateProject(
        params.workspaceId,
        params.projectId,
        {
          name: payload.name,
          description: payload.description,
          startDate: payload.startDate,
          endDate: payload.endDate,
        },
      );
      setProject(response.data.project);
      setMessage("Cập nhật thông tin dự án thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật dự án thất bại.");
    }
  }

  async function handleArchive() {
    if (!confirm("Bạn có chắc chắn muốn lưu trữ dự án này không?")) {
      return;
    }

    try {
      await archiveProject(params.workspaceId, params.projectId);
      router.push(`/workspaces/${params.workspaceId}/projects`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu trữ dự án thất bại.");
    }
  }

  async function handleComplete() {
    if (!confirm("Xác nhận đã hoàn thành dự án này?")) {
      return;
    }

    try {
      await completeProject(params.workspaceId, params.projectId);
      router.push(`/workspaces/${params.workspaceId}/projects`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đánh dấu hoàn thành thất bại.");
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
    <AppShell workspaceId={params.workspaceId} projectId={params.projectId} title={project?.name}>
      <div className="max-w-3xl space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Cài đặt Dự án</h1>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Yêu cầu quyền hạn OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER.
            </p>
          </div>
          <button
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            type="button"
            onClick={() => void loadProject()}
            disabled={isLoading}
          >
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : project ? (
          <div className="grid gap-6">
            {/* Update Info Form */}
            <div className="border border-zinc-200/80 bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-zinc-800 mb-4 pb-3 border-b border-zinc-100">Thông tin chung</h2>
              <ProjectForm
                initialDescription={project.description}
                initialEndDate={project.endDate}
                initialName={project.name}
                initialStartDate={project.startDate}
                mode="update"
                submitLabel="Lưu thay đổi"
                onSubmit={handleUpdate}
              />
            </div>

            {/* Actions / Danger Zone Panel */}
            <div className="border border-red-200 bg-white p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-red-900 pb-3 border-b border-red-100">Vùng nguy hiểm & Hành động nhanh</h2>
              <p className="text-xs text-zinc-500">
                Hãy cẩn thận khi thực hiện các hành động này. Dự án đã lưu trữ sẽ không thể thực hiện Sprint mới.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                  type="button"
                  onClick={() => void handleComplete()}
                >
                  Đánh dấu hoàn thành (Complete)
                </button>
                <button
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                  type="button"
                  onClick={() => void handleArchive()}
                >
                  Lưu trữ dự án (Archive)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
            <p className="text-sm text-zinc-500">Không tìm thấy thông tin cấu hình dự án.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
