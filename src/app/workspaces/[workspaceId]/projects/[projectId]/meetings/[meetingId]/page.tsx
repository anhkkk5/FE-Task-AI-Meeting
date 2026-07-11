"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  cancelMeeting,
  completeMeeting,
  getMeetingDetail,
  updateMeeting,
} from "@/features/meetings/api/meetings.api";
import { MeetingDetail } from "@/features/meetings/components/MeetingDetail";
import { MeetingForm } from "@/features/meetings/components/MeetingForm";
import {
  CreateMeetingPayload,
  Meeting,
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

export default function MeetingDetailPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    meetingId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [message, setMessage] = useState("");

  const canManage = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, meetingRes, sprintsRes, membersRes, roleRes] =
        await Promise.all([
          getProjectDetail(params.workspaceId, params.projectId),
          getMeetingDetail(
            params.workspaceId,
            params.projectId,
            params.meetingId,
          ),
          getSprints(params.workspaceId, params.projectId, {
            page: 1,
            limit: 100,
          }),
          getWorkspaceMembers(params.workspaceId),
          getMyWorkspaceRole(params.workspaceId),
        ]);

      setProject(projectRes.data.project);
      setMeeting(meetingRes.data.meeting);
      setSprints(sprintsRes.data.items);
      setMembers(membersRes.data.items);
      setMyRole(roleRes.data.role);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tải chi tiết meeting thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.meetingId, params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.meetingId) {
      void loadData();
    }
  }, [
    user,
    params.workspaceId,
    params.projectId,
    params.meetingId,
    loadData,
  ]);

  async function handleUpdate(
    payload: CreateMeetingPayload | UpdateMeetingPayload,
  ) {
    if (!meeting) return;

    try {
      const response = await updateMeeting(
        params.workspaceId,
        params.projectId,
        meeting.id,
        payload as UpdateMeetingPayload,
      );
      setMeeting(response.data.meeting);
      setIsEditing(false);
      setMessage("Đã cập nhật meeting.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cập nhật meeting thất bại.",
      );
    }
  }

  async function handleCancel() {
    if (!meeting) return;
    if (!window.confirm("Bạn muốn hủy meeting này?")) return;

    setIsMutating(true);
    try {
      await cancelMeeting(params.workspaceId, params.projectId, meeting.id);
      await loadData();
      setMessage("Đã hủy meeting.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Hủy meeting thất bại.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function handleComplete() {
    if (!meeting) return;

    setIsMutating(true);
    try {
      await completeMeeting(params.workspaceId, params.projectId, meeting.id);
      await loadData();
      setMessage("Đã hoàn thành meeting.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Hoàn thành meeting thất bại.",
      );
    } finally {
      setIsMutating(false);
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
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings`}
          >
            Quay lại danh sách meeting
          </Link>
          {canManage && meeting ? (
            <button
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
              type="button"
              onClick={() => setIsEditing((value) => !value)}
            >
              {isEditing ? "Đóng form sửa" : "Sửa meeting"}
            </button>
          ) : null}
        </div>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : meeting ? (
          <>
            <MeetingDetail
              canManage={canManage}
              isMutating={isMutating}
              meeting={meeting}
              projectId={params.projectId}
              workspaceId={params.workspaceId}
              onCancel={() => void handleCancel()}
              onComplete={() => void handleComplete()}
            />

            {isEditing && canManage ? (
              <section className="rounded border border-[#dfe1e6] bg-white p-5">
                <h2 className="mb-5 text-lg font-semibold text-[#172b4d]">
                  Cập nhật meeting
                </h2>
                <MeetingForm
                  initialMeeting={meeting}
                  members={members}
                  sprints={sprints}
                  submitLabel="Cập nhật"
                  onSubmit={handleUpdate}
                />
              </section>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
            Không tìm thấy meeting.
          </div>
        )}
      </div>
    </AppShell>
  );
}
