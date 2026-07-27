"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole, getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { createTask } from "@/features/tasks/api/tasks.api";
import { TaskForm } from "@/features/tasks/components/TaskForm";
import { CreateTaskPayload } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function CreateTaskPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWrite = writeRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadContext = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectResponse, membersResponse, sprintsResponse, roleResponse] =
          await Promise.all([
            getProjectDetail(params.workspaceId, params.projectId),
            getWorkspaceMembers(params.workspaceId),
            getSprints(params.workspaceId, params.projectId, {
              page: 1,
              limit: 100,
            }),
            getMyWorkspaceRole(params.workspaceId),
          ]);
        setProject(projectResponse.data.project);
        setMembers(membersResponse.data.items);
        setSprints(
          sprintsResponse.data.items.filter(
            (sprint) =>
              sprint.status !== "COMPLETED" && sprint.status !== "CANCELLED",
          ),
        );
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Tải dữ liệu tạo task thất bại.",
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

  async function handleSubmit(payload: CreateTaskPayload) {
    if (!canWrite) {
      setMessage("Bạn không có quyền tạo task trong dự án này.");
      return;
    }

    try {
      const response = await createTask(
        params.workspaceId,
        params.projectId,
        payload,
      );
      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${response.data.task.id}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tạo task thất bại.");
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
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="max-w-4xl space-y-6">
        {/* Header Card (Trắng chủ đạo) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100/60 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#4F8EB0]/10 px-3 py-1 text-xs font-bold text-[#4F8EB0]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Backlog Management
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Tạo Task mới
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                {project?.name ?? "Dự án"} {myRole ? `· Vai trò của bạn: ${myRole}` : ""}
              </p>
            </div>

            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints`}
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại Backlog
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

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#4F8EB0] border-t-transparent"></div>
          </div>
        ) : canWrite ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 sm:p-8">
            <TaskForm
              members={members}
              sprints={sprints}
              submitLabel="Tạo task mới"
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-sm">
            Bạn cần quyền OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER và dự án phải
            ACTIVE để tạo task.
          </div>
        )}
      </div>
    </AppShell>
  );
}
