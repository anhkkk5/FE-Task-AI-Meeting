"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  generateMyPersonalDailyReport,
  getMemberPersonalDailyReports,
  getMyPersonalDailyReports,
  getReportAutomationStatus,
} from "@/features/ai-reports/api/ai-reports.api";
import { PersonalReportList } from "@/features/ai-reports/components/PersonalReportList";
import { ReportAutomationBanner } from "@/features/ai-reports/components/ReportAutomationBanner";
import {
  AiPersonalReport,
  AiReportsQuery,
  ReportAutomationStatus,
} from "@/features/ai-reports/types/ai-report.type";
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
const readerRoles = [...managerRoles, "MEMBER"];

type ReportsMeta = {
  total: number;
  page: number;
  limit: number;
};

export default function PersonalAiReportsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [items, setItems] = useState<AiPersonalReport[]>([]);
  const [meta, setMeta] = useState<ReportsMeta>({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [myRole, setMyRole] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [query, setQuery] = useState<AiReportsQuery>({ page: 1, limit: 20 });
  const [automation, setAutomation] = useState<ReportAutomationStatus | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const canManage = managerRoles.includes(myRole);
  const canRead = readerRoles.includes(myRole);
  const activeMembers = members.filter((member) => member.status === "ACTIVE");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, membersRes, roleRes, automationRes] =
        await Promise.all([
          getProjectDetail(params.workspaceId, params.projectId),
          getSprints(params.workspaceId, params.projectId, {
            page: 1,
            limit: 100,
          }),
          getWorkspaceMembers(params.workspaceId),
          getMyWorkspaceRole(params.workspaceId),
          getReportAutomationStatus(params.workspaceId, params.projectId),
        ]);

      const role = roleRes.data.role;
      const canReadByRole = readerRoles.includes(role);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMembers(membersRes.data.items);
      setMyRole(role);
      setAutomation(automationRes.data);

      if (!canReadByRole) {
        setItems([]);
        setMeta({ total: 0, page: 1, limit: 20 });
        setMessage("VIEWER không được tạo hoặc xem AI personal report.");
        return;
      }

      const reportsRes =
        managerRoles.includes(role) && selectedMemberId
          ? await getMemberPersonalDailyReports(
              params.workspaceId,
              params.projectId,
              selectedMemberId,
              query,
            )
          : await getMyPersonalDailyReports(
              params.workspaceId,
              params.projectId,
              query,
            );

      setItems(reportsRes.data.items);
      setMeta(reportsRes.data.meta);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tải báo cáo AI thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    params.projectId,
    params.workspaceId,
    query,
    selectedMemberId,
  ]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadData();
    }
  }, [user, params.workspaceId, params.projectId, loadData]);

  function patchQuery(next: Partial<AiReportsQuery>) {
    setQuery((current) => ({
      ...current,
      ...next,
      page: 1,
      limit: 20,
    }));
  }

  async function handleRegenerateToday() {
    setIsRegenerating(true);
    setMessage("");

    try {
      await generateMyPersonalDailyReport(
        params.workspaceId,
        params.projectId,
        {
          reportDate: new Date().toLocaleDateString("en-CA"),
          sprintId: query.sprintId,
        },
      );
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tạo lại báo cáo hôm nay thất bại.",
      );
    } finally {
      setIsRegenerating(false);
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
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
                Báo cáo cá nhân AI
              </p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Báo cáo cá nhân bằng AI
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                AI tự động tổng hợp Cập nhật hằng ngày, công việc và sprint thành báo cáo cá nhân theo ngày.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team`}
              >
                Báo cáo nhóm
              </Link>
              <button
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={() => void loadData()}
              >
                Làm mới
              </button>
              {canRead ? (
                <button
                  className="flex h-10 items-center rounded-xl bg-brand-600 px-4 text-xs font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isRegenerating}
                  type="button"
                  onClick={() => void handleRegenerateToday()}
                >
                  {isRegenerating ? "Đang tạo lại..." : "Tạo lại báo cáo hôm nay"}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <ReportAutomationBanner status={automation} />

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[180px_180px_220px_1fr_auto]">
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Từ ngày
            <input
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500"
              type="date"
              value={query.fromDate ?? ""}
              onChange={(event) =>
                patchQuery({ fromDate: event.target.value || undefined })
              }
            />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Đến ngày
            <input
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500"
              type="date"
              value={query.toDate ?? ""}
              onChange={(event) =>
                patchQuery({ toDate: event.target.value || undefined })
              }
            />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Sprint
            <select
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500"
              value={query.sprintId ?? ""}
              onChange={(event) =>
                patchQuery({ sprintId: event.target.value || undefined })
              }
            >
              <option value="">Tất cả sprint</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </label>
          {canManage ? (
            <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Thành viên
              <select
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500"
                value={selectedMemberId}
                onChange={(event) => {
                  setSelectedMemberId(event.target.value);
                  setQuery((current) => ({ ...current, page: 1, limit: 20 }));
                }}
              >
                <option value="">Báo cáo của tôi</option>
                {activeMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName ?? member.email ?? member.userId}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="hidden lg:block"></div>
          )}
          <button
            className="h-11 self-end rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
            type="button"
            onClick={() => {
              setSelectedMemberId("");
              setQuery({ page: 1, limit: 20 });
            }}
          >
            Xóa lọc
          </button>
        </section>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{meta.total} báo cáo</span>
          <span>
            Trang {meta.page} · {meta.limit} báo cáo mỗi trang
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
          </div>
        ) : canRead ? (
          <PersonalReportList
            items={items}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
