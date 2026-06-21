"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import {
  getSprintDetail,
  updateSprint,
} from "@/features/sprints/api/sprints.api";
import { SprintForm } from "@/features/sprints/components/SprintForm";
import { SprintStatusBadge } from "@/features/sprints/components/SprintStatusBadge";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function SprintSettingsPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    sprintId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canEdit =
    writeRoles.includes(myRole) &&
    project?.status === "ACTIVE" &&
    sprint?.status === "PLANNED";

  const loadSprint = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectResponse, sprintResponse, roleResponse] =
          await Promise.all([
            getProjectDetail(params.workspaceId, params.projectId),
            getSprintDetail(
              params.workspaceId,
              params.projectId,
              params.sprintId,
            ),
            getMyWorkspaceRole(params.workspaceId),
          ]);
        setProject(projectResponse.data.project);
        setSprint(sprintResponse.data.sprint);
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Tải cấu hình sprint thất bại.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [params.projectId, params.sprintId, params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.sprintId) {
      void loadSprint();
    }
  }, [
    user,
    params.workspaceId,
    params.projectId,
    params.sprintId,
    loadSprint,
  ]);

  async function handleSubmit(payload: {
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
  }) {
    if (!canEdit) {
      setMessage("Chỉ sprint PLANNED trong dự án ACTIVE mới được chỉnh sửa.");
      return;
    }

    try {
      const response = await updateSprint(
        params.workspaceId,
        params.projectId,
        params.sprintId,
        payload,
      );
      setSprint(response.data.sprint);
      setMessage("Cập nhật sprint thành công.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cập nhật sprint thất bại.",
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Sprint settings
              </p>
              <h1 className="mt-1 text-xl font-bold text-zinc-900">
                Chỉnh sửa Sprint
              </h1>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                {project?.name ?? "Dự án"} {myRole ? `· Vai trò: ${myRole}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {sprint ? <SprintStatusBadge status={sprint.status} /> : null}
              <Link
                className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/${params.sprintId}`}
              >
                Chi tiết
              </Link>
            </div>
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
        ) : sprint && canEdit ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <SprintForm
              initialEndDate={sprint.endDate}
              initialGoal={sprint.goal}
              initialName={sprint.name}
              initialStartDate={sprint.startDate}
              submitLabel="Lưu thay đổi"
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900">
              Không thể chỉnh sửa sprint
            </h2>
            <p className="mt-2 text-xs leading-6 text-zinc-500">
              Sprint chỉ được chỉnh sửa khi đang ở trạng thái PLANNED, dự án
              còn ACTIVE và tài khoản có quyền OWNER, SCRUM_MASTER hoặc
              PROJECT_MANAGER.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
