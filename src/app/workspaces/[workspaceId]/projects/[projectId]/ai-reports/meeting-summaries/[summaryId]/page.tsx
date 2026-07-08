"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMeetingSummaryDetail } from "@/features/ai-reports/api/ai-reports.api";
import { MeetingSummaryDetail } from "@/features/ai-reports/components/MeetingSummaryDetail";
import { AiMeetingSummary } from "@/features/ai-reports/types/ai-report.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

export default function MeetingSummaryDetailPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    summaryId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<AiMeetingSummary | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, summaryRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getMeetingSummaryDetail(
          params.workspaceId,
          params.projectId,
          params.summaryId,
        ),
      ]);

      setProject(projectRes.data.project);
      setSummary(summaryRes.data.summary);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Load meeting summary failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.summaryId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.summaryId) {
      void loadData();
    }
  }, [
    user,
    params.workspaceId,
    params.projectId,
    params.summaryId,
    loadData,
  ]);

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                AI meeting summary detail
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Summary version
              </h1>
              <p className="mt-2 break-all text-sm font-medium text-zinc-500">
                Summary ID: {params.summaryId}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                type="button"
                onClick={() => void loadData()}
              >
                Refresh
              </button>
              {summary ? (
                <Link
                  className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${summary.meetingId}/summary`}
                >
                  Meeting summary
                </Link>
              ) : null}
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
        ) : summary ? (
          <MeetingSummaryDetail summary={summary} />
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
            Meeting summary not found.
          </div>
        )}
      </div>
    </AppShell>
  );
}
