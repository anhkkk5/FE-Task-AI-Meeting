"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { createDailyUpdate } from "@/features/daily-updates/api/daily-updates.api";
import { DailyUpdateForm } from "@/features/daily-updates/components/DailyUpdateForm";
import {
  CreateDailyUpdatePayload,
  UpdateDailyUpdatePayload,
} from "@/features/daily-updates/types/daily-update.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER", "MEMBER"];

export default function CreateDailyUpdatePage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWrite = writeRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, roleRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
        getMyWorkspaceRole(params.workspaceId),
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMyRole(roleRes.data.role);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tải dữ liệu tạo daily update thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadContext();
    }
  }, [user, params.workspaceId, params.projectId, loadContext]);

  async function handleSubmit(
    payload: CreateDailyUpdatePayload | UpdateDailyUpdatePayload,
  ) {
    if (!canWrite) {
      setMessage("Bạn không có quyền viết daily update trong project này.");
      return;
    }

    try {
      const response = await createDailyUpdate(
        params.workspaceId,
        params.projectId,
        payload as CreateDailyUpdatePayload,
      );
      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/${response.data.dailyUpdate.id}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tạo daily update thất bại.",
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
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Daily update
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Viết daily update
              </h1>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {project?.name ?? "Project"} {myRole ? `· Vai trò: ${myRole}` : ""}
              </p>
            </div>
            <Link
              className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/me`}
            >
              Daily update của tôi
            </Link>
          </div>
        </section>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : canWrite ? (
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <DailyUpdateForm
              sprints={sprints}
              submitLabel="Lưu daily update"
              onSubmit={handleSubmit}
            />
          </section>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
            Bạn cần là OWNER, SCRUM_MASTER, PROJECT_MANAGER hoặc MEMBER và
            project phải ACTIVE để viết daily update.
          </div>
        )}
      </div>
    </AppShell>
  );
}
