"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getTeamDailyReports } from "@/features/ai-reports/api/ai-reports.api";
import { TeamReportList } from "@/features/ai-reports/components/TeamReportList";
import {
  AiReportsQuery,
  AiTeamReport,
} from "@/features/ai-reports/types/ai-report.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

type ReportsMeta = {
  total: number;
  page: number;
  limit: number;
};

export default function TeamAiReportsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [items, setItems] = useState<AiTeamReport[]>([]);
  const [meta, setMeta] = useState<ReportsMeta>({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [myRole, setMyRole] = useState("");
  const [query, setQuery] = useState<AiReportsQuery>({ page: 1, limit: 20 });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canManage = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, roleRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
        getMyWorkspaceRole(params.workspaceId),
      ]);

      const role = roleRes.data.role;

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMyRole(role);

      if (!managerRoles.includes(role)) {
        setItems([]);
        setMeta({ total: 0, page: 1, limit: 20 });
        setMessage(
          "Chi OWNER, SCRUM_MASTER hoac PROJECT_MANAGER duoc xem AI team report.",
        );
        return;
      }

      const reportsRes = await getTeamDailyReports(
        params.workspaceId,
        params.projectId,
        query,
      );

      setItems(reportsRes.data.items);
      setMeta(reportsRes.data.meta);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tai AI team report that bai.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId, query]);

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
                AI team reports
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Bao cao giao ban nhom bang AI
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-zinc-500">
                Tong hop daily update, task, blocker, rui ro va member chua
                cap nhat daily update trong project hoac sprint.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/personal`}
              >
                Personal reports
              </Link>
              <button
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                type="button"
                onClick={() => void loadData()}
              >
                Lam moi
              </button>
              {canManage ? (
                <Link
                  className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team/generate`}
                >
                  Tao team report
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[180px_180px_1fr_auto]">
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Tu ngay
            <input
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-800 outline-none transition focus:border-blue-600"
              type="date"
              value={query.fromDate ?? ""}
              onChange={(event) =>
                patchQuery({ fromDate: event.target.value || undefined })
              }
            />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Den ngay
            <input
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-800 outline-none transition focus:border-blue-600"
              type="date"
              value={query.toDate ?? ""}
              onChange={(event) =>
                patchQuery({ toDate: event.target.value || undefined })
              }
            />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Sprint
            <select
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-800 outline-none transition focus:border-blue-600"
              value={query.sprintId ?? ""}
              onChange={(event) =>
                patchQuery({ sprintId: event.target.value || undefined })
              }
            >
              <option value="">Tat ca sprint</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="h-11 self-end rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white transition hover:bg-zinc-800"
            type="button"
            onClick={() => setQuery({ page: 1, limit: 20 })}
          >
            Xoa loc
          </button>
        </section>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
          <span>{meta.total} report</span>
          <span>
            Page {meta.page} / limit {meta.limit}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : canManage ? (
          <TeamReportList
            items={items}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
