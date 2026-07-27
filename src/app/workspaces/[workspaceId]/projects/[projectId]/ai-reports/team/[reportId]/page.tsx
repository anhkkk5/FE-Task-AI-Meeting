"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  approveTeamDailyReport,
  cancelTeamDailyReport,
  getTeamDailyReportDetail,
  updateTeamDailyReport,
} from "@/features/ai-reports/api/ai-reports.api";
import { TeamReportActionBar } from "@/features/ai-reports/components/TeamReportActionBar";
import { TeamReportDetail } from "@/features/ai-reports/components/TeamReportDetail";
import {
  buildDraftFromOutput,
  buildUpdatePayload,
  TeamReportDraft,
} from "@/features/ai-reports/components/TeamReportEditor";
import { AiTeamReport } from "@/features/ai-reports/types/ai-report.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function TeamAiReportDetailPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    reportId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<AiTeamReport | null>(null);
  const [myRole, setMyRole] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [draft, setDraft] = useState<TeamReportDraft>({
    summary: "",
    teamProgress: "",
    completedWork: "",
    todayFocus: "",
    blockers: "",
    risks: "",
    recommendations: "",
  });
  const [originalDraft, setOriginalDraft] = useState<TeamReportDraft>(draft);

  // Thanh vien thuong mo trang nay tu link trong mail bao cao da duyet, nen chi
  // duoc doc. Uu tien co `canManage` cua backend de frontend khong tu suy ra
  // quyen roi lech voi phia server; `myRole` chi la phuong an du phong khi API
  // cu chua tra co nay.
  const canReview = canManage || managerRoles.includes(myRole);
  const isReadOnly = Boolean(report) && !canReview;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, reportRes, roleRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getTeamDailyReportDetail(
          params.workspaceId,
          params.projectId,
          params.reportId,
        ),
        getMyWorkspaceRole(params.workspaceId),
      ]);

      const loadedReport = reportRes.data.report;
      setProject(projectRes.data.project);
      setReport(loadedReport);
      setCanManage(Boolean(reportRes.data.canManage));
      setMyRole(roleRes.data.role);

      const draftObj = buildDraftFromOutput(loadedReport.aiOutput);
      setDraft(draftObj);
      setOriginalDraft(draftObj);
    } catch (error) {
      setReport(null);
      setMessage(
        error instanceof Error ? error.message : "Tải báo cáo nhóm thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.reportId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId && params.reportId) {
      void loadData();
    }
  }, [
    user,
    params.workspaceId,
    params.projectId,
    params.reportId,
    loadData,
  ]);

  const handleToggleEdit = () => {
    if (isEditing) {
      setDraft(originalDraft);
    }
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    if (!report) return;

    const payload = buildUpdatePayload(draft, originalDraft);
    if (!Object.keys(payload).length) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const res = await updateTeamDailyReport(
        params.workspaceId,
        params.projectId,
        params.reportId,
        payload,
      );

      const updated = res.data.report;
      setReport(updated);

      const updatedDraft = buildDraftFromOutput(updated.aiOutput);
      setDraft(updatedDraft);
      setOriginalDraft(updatedDraft);
      setIsEditing(false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Lưu thay đổi thất bại.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!report) return;

    setIsApproving(true);
    setMessage("");

    try {
      const res = await approveTeamDailyReport(
        params.workspaceId,
        params.projectId,
        params.reportId,
      );

      const approvedReport = res.data.report;
      setReport(approvedReport);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Duyệt báo cáo thất bại.",
      );
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Huy phien giao ban.
   *
   * Hoi lai truoc khi goi vi phien da huy khong mo lai duoc, phai tao phien moi.
   */
  const handleCancel = async () => {
    if (!report) return;

    const confirmed = window.confirm(
      "Hủy phiên giao ban này? Phiên đã hủy không mở lại được, bạn sẽ phải tạo phiên mới.",
    );
    if (!confirmed) return;

    setIsCancelling(true);
    setMessage("");

    try {
      const res = await cancelTeamDailyReport(
        params.workspaceId,
        params.projectId,
        params.reportId,
      );
      setReport(res.data.report);
      setIsEditing(false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Hủy phiên giao ban thất bại.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
        <section
          className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
          data-print-hidden="true"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
                Chi tiết báo cáo nhóm
              </p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Báo cáo giao ban nhóm
              </h1>
              <p className="mt-1.5 break-all text-xs font-medium text-slate-500">
                Mã báo cáo: {params.reportId}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={() => void loadData()}
              >
                Làm mới
              </button>
              <Link
                className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/personal`}
              >
                Báo cáo cá nhân
              </Link>
              {/*
                Danh sach bao cao nhom chi danh cho nhom quan ly, hien link nay
                voi thanh vien thuong chi dan ho toi mot trang bao loi.
              */}
              <Link
                className="flex h-10 items-center rounded-xl bg-brand-600 px-4 text-xs font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
                href={
                  canReview
                    ? `/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team`
                    : `/workspaces/${params.workspaceId}/projects/${params.projectId}`
                }
              >
                {canReview ? "Danh sách báo cáo nhóm" : "Về trang dự án"}
              </Link>
            </div>
          </div>
        </section>

        {message ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
            data-print-hidden="true"
          >
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div
            className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white"
            data-print-hidden="true"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {isReadOnly ? (
              <div
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
                data-print-hidden="true"
                id="team-report-read-only-notice"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Chế độ chỉ đọc
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Đây là báo cáo giao ban đã được quản lý duyệt và gửi cho cả
                    nhóm. Bạn xem và xuất PDF được, phần sửa và duyệt thuộc
                    nhóm quản lý.
                  </p>
                </div>
              </div>
            ) : null}

            <TeamReportActionBar
              canReview={canReview}
              isApproving={isApproving}
              isCancelling={isCancelling}
              isEditing={isEditing}
              isSaving={isSaving}
              reviewStatus={report.reviewStatus || "DRAFT"}
              onApprove={handleApprove}
              onCancel={handleCancel}
              onPrint={handlePrint}
              onSave={handleSave}
              onToggleEdit={handleToggleEdit}
            />

            <TeamReportDetail
              canHandleActionItems={
                canReview && report.reviewStatus !== "CANCELLED"
              }
              draft={draft}
              isEditing={isEditing}
              report={report}
              onDraftChange={setDraft}
            />
          </div>
        ) : message ? null : (
          <div
            className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm"
            data-print-hidden="true"
          >
            Không tìm thấy báo cáo nhóm.
          </div>
        )}
      </div>
    </AppShell>
  );
}
