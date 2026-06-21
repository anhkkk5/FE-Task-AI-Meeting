"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getWorkspaceDetail } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
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
        setMessage(error instanceof Error ? error.message : "Tải thông tin không gian thất bại.");
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell workspaceId={params.workspaceId}>
      <div className="space-y-6">
        {/* Navigation Toolbar */}
        <div className="flex flex-wrap gap-2 justify-between items-center bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="flex gap-2">
            <Link
              className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              href={`/workspaces/${params.workspaceId}/projects`}
            >
              Xem dự án
            </Link>
            <Link
              className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              href={`/workspaces/${params.workspaceId}/members`}
            >
              Thành viên
            </Link>
            <Link
              className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              href={`/workspaces/${params.workspaceId}/settings`}
            >
              Cài đặt
            </Link>
          </div>
          <button
            className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            type="button"
            onClick={() => void loadWorkspace()}
            disabled={isLoading}
          >
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {/* Error message */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {/* Detail Card */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : workspace ? (
          <div className="border border-zinc-200/80 bg-white p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{workspace.name}</h1>
              <p className="mt-0.5 text-xs text-zinc-500 font-mono">ID: {workspace.id} | Slug: @{workspace.slug}</p>
            </div>

            <div className="border-t border-zinc-100 pt-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Thông tin cấu hình</h3>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Vai trò của tôi
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-indigo-700">
                    {workspace.myRole || "MEMBER"}
                  </dd>
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Trạng thái
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-emerald-700">
                    {workspace.status}
                  </dd>
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Gói dịch vụ
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-amber-700 uppercase">
                    {workspace.plan}
                  </dd>
                </div>
              </dl>
            </div>

            {workspace.description ? (
              <div className="border-t border-zinc-100 pt-6">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Mô tả</h3>
                <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                  {workspace.description}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
            <p className="text-sm text-zinc-500">Không tìm thấy thông tin không gian làm việc.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
