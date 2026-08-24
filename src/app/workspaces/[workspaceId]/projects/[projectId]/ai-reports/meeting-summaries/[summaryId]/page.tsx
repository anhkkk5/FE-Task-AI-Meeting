"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  RotateCw,
  Calendar,
  AlertCircle,
} from "lucide-react";
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
        error instanceof Error ? error.message : "Tải chi tiết phiên bản tóm tắt thất bại.",
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {summary ? (
                  <Link
                    href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${summary.meetingId}/summary`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Tóm tắt cuộc họp gốc
                  </Link>
                ) : null}
                <span className="text-slate-300">/</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  <Sparkles className="h-3 w-3" />
                  Phiên bản tóm tắt AI
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Chi tiết phiên bản tóm tắt
              </h1>

              <p className="text-xs text-slate-400 font-mono">
                Mã định danh (ID): {params.summaryId}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                type="button"
                onClick={() => void loadData()}
              >
                <RotateCw className="h-3.5 w-3.5" />
                Làm mới
              </button>

              {summary ? (
                <Link
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${summary.meetingId}/summary`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Trang tóm tắt chính
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900 shadow-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-xs font-bold text-slate-600">Đang tải phiên bản tóm tắt...</p>
          </div>
        ) : summary ? (
          <MeetingSummaryDetail summary={summary} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <p className="text-sm font-bold text-slate-700">
              Không tìm thấy phiên bản tóm tắt này.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
