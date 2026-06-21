"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceForm } from "@/features/workspaces/components/WorkspaceForm";
import {
  archiveWorkspace,
  getWorkspaceDetail,
  updateWorkspace,
} from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

export default function WorkspaceSettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspace = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await getWorkspaceDetail(
          params.workspaceId,
        );
        setWorkspace(response.data.workspace);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải thông tin cấu hình thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId) {
      void loadWorkspace();
    }
  }, [user, params.workspaceId, loadWorkspace]);

  async function handleUpdate(payload: {
    name: string;
    description?: string;
  }) {
    try {
      const response = await updateWorkspace(params.workspaceId, {
        name: payload.name,
        description: payload.description,
      });
      setWorkspace(response.data.workspace);
      setMessage("Cập nhật thông tin workspace thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật thất bại.");
    }
  }

  async function handleArchive() {
    if (!confirm("Bạn có chắc chắn muốn lưu trữ workspace này không?")) {
      return;
    }

    try {
      await archiveWorkspace(params.workspaceId);
      router.push("/workspaces");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu trữ workspace thất bại.");
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
    <AppShell workspaceId={params.workspaceId}>
      <div className="max-w-3xl space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Cài đặt Không gian làm việc</h1>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Chỉ OWNER mới có quyền thay đổi thông tin này.
            </p>
          </div>
          <button
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            type="button"
            onClick={() => void loadWorkspace()}
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
        ) : workspace ? (
          <div className="grid gap-6">
            {/* General Settings */}
            <div className="border border-zinc-200/80 bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-zinc-800 mb-4 pb-3 border-b border-zinc-100">Thông tin chung</h2>
              <WorkspaceForm
                initialDescription={workspace.description}
                initialName={workspace.name}
                submitLabel="Lưu thay đổi"
                onSubmit={handleUpdate}
              />
            </div>

            {/* Danger Zone */}
            <div className="border border-red-200 bg-white p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-red-900 pb-3 border-b border-red-100">
                Lưu trữ không gian làm việc
              </h2>
              <p className="text-xs text-zinc-500">
                Lưu trữ không gian làm việc này sẽ vô hiệu hóa tất cả hoạt động tạo dự án mới và quản lý sprint. Hành động này không thể hoàn tác dễ dàng.
              </p>
              <button
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                type="button"
                onClick={() => void handleArchive()}
              >
                Lưu trữ Workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
            <p className="text-sm text-zinc-500">Không tìm thấy cấu hình workspace.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
