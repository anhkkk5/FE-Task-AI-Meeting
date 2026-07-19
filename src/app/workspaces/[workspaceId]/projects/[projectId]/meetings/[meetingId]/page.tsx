"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  cancelMeeting,
  completeMeeting,
  deleteMeeting,
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
  const router = useRouter();
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
  const canDelete = Boolean(meeting && (canManage || meeting.createdBy === user?.id));

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
        error instanceof Error
          ? error.message
          : "Tải chi tiết cuộc họp thất bại.",
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

    setIsMutating(true);
    try {
      const response = await updateMeeting(
        params.workspaceId,
        params.projectId,
        meeting.id,
        payload as UpdateMeetingPayload,
      );
      setMeeting(response.data.meeting);
      setIsEditing(false);
      setMessage("Đã cập nhật cuộc họp.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cập nhật cuộc họp thất bại.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function handleCancel() {
    if (!meeting) return;
    if (!window.confirm("Bạn muốn hủy cuộc họp này?")) return;

    setIsMutating(true);
    try {
      await cancelMeeting(params.workspaceId, params.projectId, meeting.id);
      await loadData();
      setMessage("Đã hủy cuộc họp.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Hủy cuộc họp thất bại.",
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
      setMessage("Đã hoàn thành cuộc họp.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Hoàn thành cuộc họp thất bại.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete() {
    if (!meeting || !canDelete) return;
    if (!window.confirm("Bạn muốn xóa cuộc họp này khỏi danh sách?")) return;

    setIsMutating(true);
    try {
      await deleteMeeting(params.workspaceId, params.projectId, meeting.id);
      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Xóa cuộc họp thất bại.",
      );
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
            className="rounded border border-[#dfe1e6] bg-white px-4 py-2 text-sm font-semibold text-[#172b4d] transition hover:bg-[#f4f5f7]"
            href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings`}
          >
            Quay lại danh sách cuộc họp
          </Link>
          {canManage && meeting ? (
            <button
              className="rounded border border-[#dfe1e6] bg-white px-4 py-2 text-sm font-semibold text-[#172b4d] transition hover:bg-[#f4f5f7]"
              type="button"
              onClick={() => setIsEditing((value) => !value)}
            >
              {isEditing ? "Đóng form sửa" : "Sửa cuộc họp"}
            </button>
          ) : null}
        </div>

        {message ? (
          <div className="rounded border border-[#f5cd47] bg-[#fff7d6] px-4 py-3 text-sm font-semibold text-[#7f5f01]">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded border border-[#dfe1e6] bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent"></div>
          </div>
        ) : meeting ? (
          <>
            <MeetingDetail
              canDelete={canDelete}
              canManage={canManage}
              isMutating={isMutating}
              meeting={meeting}
              projectId={params.projectId}
              workspaceId={params.workspaceId}
              onCancel={() => void handleCancel()}
              onComplete={() => void handleComplete()}
              onDelete={() => void handleDelete()}
            />

            {isEditing && canManage ? (
              <section className="rounded border border-[#dfe1e6] bg-white p-5">
                <h2 className="mb-5 text-lg font-semibold text-[#172b4d]">
                  Cập nhật cuộc họp
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
          <div className="rounded border border-[#dfe1e6] bg-white p-6 text-sm font-semibold text-[#44546f]">
            Không tìm thấy cuộc họp.
          </div>
        )}
      </div>
    </AppShell>
  );
}
