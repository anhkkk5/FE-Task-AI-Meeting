"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  generateMeetingSummary,
  getMeetingSummaries,
  getMeetingSummary,
} from "@/features/ai-reports/api/ai-reports.api";
import { MeetingSummaryDetail } from "@/features/ai-reports/components/MeetingSummaryDetail";
import { MeetingSummaryGenerateButton } from "@/features/ai-reports/components/MeetingSummaryGenerateButton";
import { MeetingSummaryHistory } from "@/features/ai-reports/components/MeetingSummaryHistory";
import { AiMeetingSummary } from "@/features/ai-reports/types/ai-report.type";
import { getMeetingDetail } from "@/features/meetings/api/meetings.api";
import { Meeting } from "@/features/meetings/types/meeting.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

function isNotFound(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("not found");
}

export default function MeetingSummaryPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    meetingId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [summary, setSummary] = useState<AiMeetingSummary | null>(null);
  const [history, setHistory] = useState<AiMeetingSummary[]>([]);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canManage = managerRoles.includes(myRole);
  const hasTranscript = Boolean(meeting?.mongoTranscriptId);

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
        const [summaryRes, historyRes] = await Promise.all([
          getMeetingSummary(
            params.workspaceId,
            params.projectId,
            params.meetingId,
          ),
          getMeetingSummaries(
            params.workspaceId,
            params.projectId,
            params.meetingId,
            { page: 1, limit: 10 },
          ),
        ]);

        setSummary(summaryRes.data.summary);
        setHistory(historyRes.data.items);
      } catch (error) {
        if (isNotFound(error)) {
          setSummary(null);
          setHistory([]);
        } else {
          throw error;
        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Load meeting summary failed.",
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

  async function handleGenerate(forceRegenerate: boolean) {
    setIsGenerating(true);
    setMessage("");

    try {
      const response = await generateMeetingSummary(
        params.workspaceId,
        params.projectId,
        params.meetingId,
        { forceRegenerate },
      );
      setSummary(response.data.summary);
      const historyRes = await getMeetingSummaries(
        params.workspaceId,
        params.projectId,
        params.meetingId,
        { page: 1, limit: 10 },
      );
      setHistory(historyRes.data.items);
      setMessage(
        forceRegenerate
          ? "Regenerated meeting summary."
          : "Loaded meeting summary.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Generate meeting summary failed.",
      );
    } finally {
      setIsGenerating(false);
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                AI meeting summary
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                {meeting?.title ?? "Meeting summary"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-zinc-500">
                Generate a structured summary from the stored MongoDB meeting
                transcript. The refresh token stays in HttpOnly cookie; the UI
                only sends your access token.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <MeetingSummaryGenerateButton
                canManage={canManage}
                disabled={isGenerating || isLoading}
                hasSummary={Boolean(summary)}
                hasTranscript={hasTranscript}
                onGenerate={(force) => void handleGenerate(force)}
              />
              <div className="flex flex-wrap gap-2">
                <Link
                  className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`}
                >
                  Meeting detail
                </Link>
                <Link
                  className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}/transcript`}
                >
                  Transcript
                </Link>
                <Link
                  className="flex h-10 items-center rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}/personalized-summary`}
                >
                  Personalized summary
                </Link>
              </div>
            </div>
          </div>
        </section>

        {!hasTranscript ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            This meeting does not have a transcript yet. Add transcript before
            generating an AI summary.
          </div>
        ) : null}

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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              {summary ? (
                <MeetingSummaryDetail summary={summary} />
              ) : (
                <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center shadow-sm">
                  <p className="text-sm font-bold text-zinc-700">
                    No AI summary yet.
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    Generate one from the transcript when the meeting notes are
                    ready.
                  </p>
                </section>
              )}
            </div>
            <MeetingSummaryHistory
              currentSummaryId={summary?.id}
              items={history}
              projectId={params.projectId}
              workspaceId={params.workspaceId}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
