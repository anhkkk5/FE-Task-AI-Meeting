"use client";

import Link from "next/link";
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
    description?: string;
    startDate?: string;
    endDate?: string;
  }) {
    setMessage("");

    try {
      const response = await createProject(params.workspaceId, {
        name: payload.name,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4F8EB0] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell workspaceId={params.workspaceId}>
      <div className="max-w-3xl space-y-6">
        {/* Header Card (Trắng chủ đạo) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100/60 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#4F8EB0]/10 px-3 py-1 text-xs font-bold text-[#4F8EB0]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Khởi tạo dự án
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Tạo Dự án mới
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Yêu cầu quyền hạn OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER.
              </p>
            </div>

            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              href={`/workspaces/${params.workspaceId}/projects`}
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Danh sách dự án
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

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 sm:p-8">
          <ProjectForm
            mode="create"
            submitLabel="Tạo dự án mới"
            onSubmit={handleCreate}
          />
        </div>
      </div>
    </AppShell>
  );
}
