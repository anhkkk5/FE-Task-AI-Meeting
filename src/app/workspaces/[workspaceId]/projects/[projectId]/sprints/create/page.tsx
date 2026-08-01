"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { createSprint } from "@/features/sprints/api/sprints.api";
import { SprintForm } from "@/features/sprints/components/SprintForm";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER", "MEMBER"];

export default function CreateSprintPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWrite =
    writeRoles.includes(myRole || "MEMBER") &&
    (!project || project.status === "ACTIVE");

  const loadContext = useCallback(async () => {
    if (!params.workspaceId || !params.projectId) return;

    setIsLoading(true);
    setMessage("");

    try {
      const [projectResponse, roleResponse] = await Promise.allSettled([
        getProjectDetail(params.workspaceId, params.projectId),
        getMyWorkspaceRole(params.workspaceId),
      ]);

      if (projectResponse.status === "fulfilled") {
        setProject(projectResponse.value.data.project);
      }

      if (roleResponse.status === "fulfilled") {
        setMyRole(roleResponse.value.data.role);
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadContext();
    }
  }, [user, params.workspaceId, params.projectId, loadContext]);

  async function handleSubmit(payload: {
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
  }) {
    try {
      const response = await createSprint(
        params.workspaceId,
        params.projectId,
        payload,
      );
      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tạo sprint thất bại.",
      );
    }
  }

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-600 border border-blue-100">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                Sprint Planning
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Tạo Sprint mới
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                {project?.name ?? "Dự án"} {myRole ? `· Vai trò: ${myRole}` : ""}
              </p>
            </div>

            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 shrink-0"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints`}
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              Quay lại Sprints
            </Link>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-bold text-amber-900 shadow-xs">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-1" />
              Đang tải...
            </div>
          </div>
        ) : canWrite ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
            <SprintForm
              submitLabel="Tạo sprint mới"
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-xs">
            Bạn cần quyền thành viên trong dự án để tạo sprint.
          </div>
        )}
      </div>
    </AppShell>
  );
}
