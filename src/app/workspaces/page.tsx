"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace, WorkspaceStatus } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

export default function WorkspacesPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const [status, setStatus] = useState<WorkspaceStatus | "">("");
  const [items, setItems] = useState<Workspace[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspaces = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await getMyWorkspaces(
          status === "" ? undefined : status,
        );
        setItems(response.data.items);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải danh sách không gian thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    if (user) {
      void loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Không gian làm việc (Workspaces)</h1>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Bạn có {items.length} không gian làm việc đang hoạt động
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <select
              className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none hover:border-zinc-400 transition cursor-pointer"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as WorkspaceStatus | "")
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
            <button
              className="h-10 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              type="button"
              onClick={() => void loadWorkspaces()}
            >
              Làm mới
            </button>
            <Link
              className="flex h-10 items-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 transition"
              href="/workspaces/create"
            >
              Tạo mới
            </Link>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((workspace) => (
              <div
                key={workspace.id}
                className="hover:scale-[1.01] transition-transform duration-150"
              >
                <WorkspaceCard workspace={workspace} />
              </div>
            ))}
            {items.length === 0 ? (
              <div className="col-span-2 text-center py-12 border border-dashed border-zinc-300 bg-white rounded-2xl">
                <p className="text-sm text-zinc-500 font-medium">Không tìm thấy không gian làm việc nào.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
