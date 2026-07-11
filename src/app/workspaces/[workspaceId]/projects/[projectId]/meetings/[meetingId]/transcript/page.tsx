"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  getMeetingDetail,
  getMeetingTranscript,
  saveMeetingTranscript,
} from "@/features/meetings/api/meetings.api";
import { MeetingTranscriptEditor } from "@/features/meetings/components/MeetingTranscriptEditor";
import { MeetingTranscriptViewer } from "@/features/meetings/components/MeetingTranscriptViewer";
import {
  Meeting,
  MeetingTranscript,
  SaveMeetingTranscriptPayload,
} from "@/features/meetings/types/meeting.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function MeetingTranscriptPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    meetingId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcript, setTranscript] = useState<MeetingTranscript | null>(null);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canManage = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, meetingRes, roleRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getMeetingDetail(
          params.workspaceId,
          params.projectId,
          params.meetingId,
        ),
        getMyWorkspaceRole(params.workspaceId),
      ]);

      setProject(projectRes.data.project);
      setMeeting(meetingRes.data.meeting);
      setMyRole(roleRes.data.role);

      try {
        const transcriptRes = await getMeetingTranscript(
          params.workspaceId,
          params.projectId,
          params.meetingId,
        );
        setTranscript(transcriptRes.data.transcript);
      } catch (error) {
        setTranscript(null);
        const text =
          error instanceof Error
            ? error.message
            : "Không tìm thấy biên bản meeting";

        if (!text.toLowerCase().includes("not found")) {
          setMessage(text);
        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tải biên bản thất bại.",
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

  async function handleSave(payload: SaveMeetingTranscriptPayload) {
    try {
      const response = await saveMeetingTranscript(
        params.workspaceId,
        params.projectId,
        params.meetingId,
        payload,
      );
      setTranscript(response.data.transcript);
      setMessage("Đã lưu biên bản.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Lưu biên bản thất bại.",
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
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Biên bản meeting
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                {meeting?.title ?? "Biên bản"}
              </h1>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Biên bản được lưu trong MongoDB và dùng làm dữ liệu đầu vào cho tóm tắt AI.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`}
              >
                Chi tiết meeting
              </Link>
              <Link
                className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}/summary`}
              >
                Tóm tắt AI
              </Link>
            </div>
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
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <MeetingTranscriptViewer transcript={transcript} />
            {canManage ? (
              <MeetingTranscriptEditor
                initialRawTranscript={transcript?.rawTranscript ?? ""}
                onSave={handleSave}
              />
            ) : (
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
                Chỉ OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER được nhập biên bản.
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
