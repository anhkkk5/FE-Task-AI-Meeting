"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { createMeeting } from "@/features/meetings/api/meetings.api";
import { MeetingForm } from "@/features/meetings/components/MeetingForm";
import {
  CreateMeetingPayload,
  UpdateMeetingPayload,
} from "@/features/meetings/types/meeting.type";
import {
  getMyWorkspaceRole,
  getWorkspaceMembers,
} from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function CreateMeetingPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canManage =
    managerRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, membersRes, roleRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
        getWorkspaceMembers(params.workspaceId),
        getMyWorkspaceRole(params.workspaceId),
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMembers(membersRes.data.items);
      setMyRole(roleRes.data.role);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tải dữ liệu tạo cuộc họp thất bại.",
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
    payload: CreateMeetingPayload | UpdateMeetingPayload,
  ) {
    if (!canManage) {
      setMessage("Bạn không có quyền tạo cuộc họp trong dự án này.");
      return;
    }

    try {
      const response = await createMeeting(
        params.workspaceId,
        params.projectId,
        payload as CreateMeetingPayload,
      );
      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${response.data.meeting.id}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tạo cuộc họp thất bại.",
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
      <div className="mx-auto max-w-5xl space-y-4 pb-12">
        <section className="rounded border border-[#dfe1e6] bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0c66e4]">
                Tạo cuộc họp
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#172b4d]">
                Tạo cuộc họp mới
              </h1>
              <p className="mt-2 text-sm text-[#44546f]">
                {project?.name ?? "Dự án"} {myRole ? `- Vai trò: ${myRole}` : ""}
              </p>
            </div>
            <Link
              className="flex h-9 items-center rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings`}
            >
              Danh sách cuộc họp
            </Link>
          </div>
        </section>

        {message ? (
          <div className="rounded border border-[#f5cd47] bg-[#fff7d6] px-4 py-3 text-sm font-medium text-[#7f5f01]">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded border border-[#dfe1e6] bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent"></div>
          </div>
        ) : canManage ? (
          <section className="rounded border border-[#dfe1e6] bg-white p-5">
            <MeetingForm
              members={members}
              sprints={sprints}
              submitLabel="Tạo cuộc họp"
              onSubmit={handleSubmit}
            />
          </section>
        ) : (
          <div className="rounded border border-[#dfe1e6] bg-white p-5 text-sm font-medium text-[#44546f]">
            Bạn cần là chủ workspace, scrum master hoặc quản lý dự án. Dự án
            cũng cần đang hoạt động để tạo cuộc họp.
          </div>
        )}
      </div>
    </AppShell>
  );
}
