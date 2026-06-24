"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  addMeetingParticipants,
  getMeetingDetail,
  getMeetingParticipants,
  updateParticipantAttendance,
} from "@/features/meetings/api/meetings.api";
import { MeetingParticipants } from "@/features/meetings/components/MeetingParticipants";
import {
  Meeting,
  MeetingParticipant,
  MeetingParticipantRole,
} from "@/features/meetings/types/meeting.type";
import {
  getMyWorkspaceRole,
  getWorkspaceMembers,
} from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function MeetingParticipantsPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    meetingId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canManage = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, meetingRes, membersRes, participantsRes, roleRes] =
        await Promise.all([
          getProjectDetail(params.workspaceId, params.projectId),
          getMeetingDetail(
            params.workspaceId,
            params.projectId,
            params.meetingId,
          ),
          getWorkspaceMembers(params.workspaceId),
          getMeetingParticipants(
            params.workspaceId,
            params.projectId,
            params.meetingId,
          ),
          getMyWorkspaceRole(params.workspaceId),
        ]);

      setProject(projectRes.data.project);
      setMeeting(meetingRes.data.meeting);
      setMembers(membersRes.data.items);
      setParticipants(participantsRes.data.items);
      setMyRole(roleRes.data.role);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tai participants that bai.",
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

  async function handleAdd(userId: string, role: MeetingParticipantRole) {
    try {
      const response = await addMeetingParticipants(
        params.workspaceId,
        params.projectId,
        params.meetingId,
        {
          participants: [{ userId, role }],
        },
      );
      setParticipants((current) => [...current, ...response.data.items]);
      setMessage("Da them participant.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Them participant that bai.",
      );
    }
  }

  async function handleToggleAttendance(participantId: string, attended: boolean) {
    try {
      const response = await updateParticipantAttendance(
        params.workspaceId,
        params.projectId,
        params.meetingId,
        participantId,
        { attended },
      );
      setParticipants((current) =>
        current.map((participant) =>
          participant.participantId === participantId
            ? response.data.participant
            : participant,
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cap nhat attendance that bai.",
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
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Meeting participants
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                {meeting?.title ?? "Participants"}
              </h1>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Host, note taker va thanh vien tham gia meeting.
              </p>
            </div>
            <Link
              className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`}
            >
              Chi tiet meeting
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
        ) : (
          <MeetingParticipants
            canManage={canManage}
            currentUserId={user?.id}
            members={members}
            participants={participants}
            onAdd={handleAdd}
            onToggleAttendance={handleToggleAttendance}
          />
        )}
      </div>
    </AppShell>
  );
}
