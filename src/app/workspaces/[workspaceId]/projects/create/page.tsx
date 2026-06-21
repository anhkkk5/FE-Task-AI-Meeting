"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { createProject } from "@/features/projects/api/projects.api";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateProjectPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { isLoading: authLoading } = useAuth(true);
  const [message, setMessage] = useState("");

  async function handleCreate(payload: {
    name: string;
    keyCode?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) {
    setMessage("");

    if (!payload.keyCode) {
      setMessage("Vui lòng nhập mã Key Code cho dự án.");
      return;
    }

    try {
      const response = await createProject(params.workspaceId, {
        name: payload.name,
        keyCode: payload.keyCode,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
      });
      router.push(
        `/workspaces/${params.workspaceId}/projects/${response.data.project.id}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tạo dự án thất bại.");
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
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900">Tạo Dự án mới</h1>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            Yêu cầu quyền hạn OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER.
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
          <ProjectForm
            mode="create"
            submitLabel="Tạo dự án"
            onSubmit={handleCreate}
          />
        </div>
      </div>
    </AppShell>
  );
}
