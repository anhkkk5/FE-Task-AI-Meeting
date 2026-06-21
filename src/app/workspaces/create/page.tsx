"use client";

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900">Tạo Không gian làm việc mới</h1>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            Bạn sẽ tự động trở thành OWNER của không gian này.
          </p>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {/* Form Panel */}
        <div className="border border-zinc-200/80 bg-white p-6 rounded-2xl shadow-sm">
          <WorkspaceForm submitLabel="Tạo Workspace" onSubmit={handleCreate} />
        </div>
      </div>
    </AppShell>
  );
}
