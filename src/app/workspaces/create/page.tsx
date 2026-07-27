"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceForm } from "@/features/workspaces/components/WorkspaceForm";
import { createWorkspace } from "@/features/workspaces/api/workspaces.api";
import { useAuth } from "@/hooks/useAuth";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth(true);
  const [message, setMessage] = useState("");

  async function handleCreate(payload: {
    name: string;
    description?: string;
  }) {
    setMessage("");

    try {
      const response = await createWorkspace(payload);
      router.push(`/workspaces/${response.data.workspace.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tạo không gian làm việc thất bại.");
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4F8EB0] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6 mx-auto">
        {/* Header Card (Trắng chủ đạo) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100/60 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#4F8EB0]/10 px-3 py-1 text-xs font-bold text-[#4F8EB0]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Tạo Workspace
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Tạo Không gian làm việc mới
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Bạn sẽ tự động trở thành OWNER quản trị không gian làm việc này.
              </p>
            </div>

            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              href="/workspaces"
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Danh sách Workspace
            </Link>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-semibold text-amber-900 shadow-sm">
            <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        ) : null}

        {/* Form Panel */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 sm:p-8">
          <WorkspaceForm submitLabel="Tạo Workspace mới" onSubmit={handleCreate} />
        </div>
      </div>
    </AppShell>
  );
}
