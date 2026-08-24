"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  FileText,
  User,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
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
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("not found")
  );
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
        error instanceof Error
          ? error.message
          : "Tải tóm tắt cuộc họp thất bại.",
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
          ? "Đã tạo lại tóm tắt cuộc họp mới thành công."
          : "Đã tạo tóm tắt cuộc họp thành công.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tạo tóm tắt cuộc họp thất bại.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

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
      <div className="mx-auto max-w-7xl space-y-6 pb-16">
        {/* Navigation Breadcrumb / Top Header */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Link
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại Cuộc họp
                </Link>
                <span className="text-slate-300">/</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  <Sparkles className="h-3 w-3" />
                  AI Summary
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {meeting?.title ?? "Tóm tắt cuộc họp"}
              </h1>

              <p className="text-xs font-medium text-slate-500 max-w-2xl">
                Tổng hợp thông minh từ biên bản cuộc họp: Rút trích ý chính, quyết định, rủi ro và các việc cần làm để phê duyệt thành task.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end shrink-0">
              <MeetingSummaryGenerateButton
                canManage={canManage}
                disabled={isGenerating || isLoading}
                hasSummary={Boolean(summary)}
                hasTranscript={hasTranscript}
                onGenerate={(force) => void handleGenerate(force)}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`}
                >
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Chi tiết cuộc họp
                </Link>
                <Link
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}/transcript`}
                >
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  Biên bản ghi âm
                </Link>
                <Link
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}/personalized-summary`}
                >
                  <User className="h-3.5 w-3.5" />
                  Tóm tắt của tôi
                </Link>
              </div>
            </div>
          </div>
        </section>

        {!hasTranscript && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs font-semibold text-amber-900 shadow-xs">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">Chưa có nội dung biên bản cuộc họp</p>
              <p className="text-amber-700 font-normal mt-0.5">
                Vui lòng nhập hoặc ghi nhận biên bản transcript cuộc họp trước khi tiến hành tạo tóm tắt AI.
              </p>
            </div>
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-3 text-xs font-bold text-blue-900 shadow-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
            <span>{message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
            <p className="mt-3 text-xs font-bold text-slate-600">Đang tải dữ liệu tóm tắt cuộc họp...</p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              {summary ? (
                <MeetingSummaryDetail summary={summary} />
              ) : (
                <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
                  <Sparkles className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-base font-bold text-slate-800">
                    Chưa có bản tóm tắt nào cho cuộc họp này
                  </p>
                  <p className="mt-1.5 max-w-md mx-auto text-xs text-slate-500 leading-relaxed">
                    Khi đã có biên bản nội dung cuộc họp, bạn có thể bấm nút &quot;Tạo tóm tắt AI&quot; ở phía trên để hệ thống tự động bóc tách ý chính, quyết định và việc cần làm.
                  </p>
                </section>
              )}
            </div>

            {/* Cột phải: Lịch sử phiên bản */}
            <div>
              <MeetingSummaryHistory
                currentSummaryId={summary?.id}
                items={history}
                projectId={params.projectId}
                workspaceId={params.workspaceId}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
