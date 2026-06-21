"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { createSprint } from "@/features/sprints/api/sprints.api";
import { SprintForm } from "@/features/sprints/components/SprintForm";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function CreateSprintPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWrite =
    writeRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadContext = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectResponse, roleResponse] = await Promise.all([
          getProjectDetail(params.workspaceId, params.projectId),
          getMyWorkspaceRole(params.workspaceId),
        ]);
        setProject(projectResponse.data.project);
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Tải thông tin dự án thất bại.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [params.projectId, params.workspaceId],
  );

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
    if (!canWrite) {
      setMessage("Bạn không có quyền tạo sprint trong dự án này.");
      return;
    }

    try {
      const response = await createSprint(
        params.workspaceId,
        params.projectId,
        payload,
      );
      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/${response.data.sprint.id}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tạo sprint thất bại.",
      );
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
      <div className="max-w-3xl space-y-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Sprint planning
              </p>
              <h1 className="mt-1 text-xl font-bold text-zinc-900">
                Tạo Sprint mới
              </h1>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {project?.name ?? "Dự án"} {myRole ? `· Vai trò: ${myRole}` : ""}
              </p>
            </div>
            <Link
              className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints`}
            >
              Danh sách sprint
            </Link>
          </div>
        </div>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : canWrite ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <SprintForm
              submitLabel="Tạo sprint"
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
            Bạn cần quyền OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER và dự án phải
            ACTIVE để tạo sprint.
          </div>
        )}
      </div>
    </AppShell>
  );
}
