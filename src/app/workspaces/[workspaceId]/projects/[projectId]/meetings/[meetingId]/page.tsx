"use client";

import { confirmAction } from "@/components/feedback/AppDialogProvider";

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
import { ArrowLeft, Pencil } from "lucide-react";

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
    if (!await confirmAction({ title: "Hủy cuộc họp", description: "Cuộc họp sẽ được chuyển sang trạng thái đã hủy.", confirmLabel: "Hủy cuộc họp", tone: "warning" })) return;

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
    if (!await confirmAction({ title: "Xóa cuộc họp", description: "Cuộc họp sẽ bị xóa khỏi danh sách. Thao tác này không thể hoàn tác.", confirmLabel: "Xóa cuộc họp", tone: "danger" })) return;

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
      <div className="mx-auto max-w-7xl space-y-5 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50/50"
            href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings`}
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách cuộc họp
          </Link>
          {canManage && meeting ? (
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50/50"
              type="button"
              onClick={() => setIsEditing((value) => !value)}
            >
              <Pencil className="h-4 w-4" /> {isEditing ? "Đóng form sửa" : "Sửa cuộc họp"}
            </button>
          ) : null}
        </div>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xs">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
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
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <h2 className="mb-5 text-xl font-extrabold text-slate-900">
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
