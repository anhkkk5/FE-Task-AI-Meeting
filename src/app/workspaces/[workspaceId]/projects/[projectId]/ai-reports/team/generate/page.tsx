"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { generateTeamDailyReport } from "@/features/ai-reports/api/ai-reports.api";
import { TeamReportGenerateForm } from "@/features/ai-reports/components/TeamReportGenerateForm";
import { GenerateTeamReportPayload } from "@/features/ai-reports/types/ai-report.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function GenerateTeamAiReportPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canGenerate = managerRoles.includes(myRole);

  const loadContext = useCallback(async () => {
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

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMyRole(roleRes.data.role);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tải dữ liệu tạo báo cáo nhóm thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadContext();
    }
  }, [user, params.workspaceId, params.projectId, loadContext]);

  async function handleSubmit(payload: GenerateTeamReportPayload) {
    if (!canGenerate) {
      setMessage(
        "Chi OWNER, SCRUM_MASTER hoac PROJECT_MANAGER duoc tao AI team report.",
      );
      return;
    }

    try {
      const response = await generateTeamDailyReport(
        params.workspaceId,
        params.projectId,
        payload,
      );

      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team/${response.data.report.id}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tạo báo cáo nhóm thất bại.",
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
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
                Báo cáo nhóm AI
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Tạo báo cáo giao ban nhóm
              </h1>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {project?.name ?? "Dự án"} {myRole ? `- Vai trò: ${myRole}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/personal`}
              >
                Báo cáo cá nhân
              </Link>
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team`}
              >
                Báo cáo nhóm
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
        ) : canGenerate ? (
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <TeamReportGenerateForm
              sprints={sprints}
              submitLabel="Tạo báo cáo nhóm"
              onSubmit={handleSubmit}
            />
          </section>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
            Bạn cần là OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER để tạo báo cáo
            nhóm bằng AI. MEMBER và VIEWER không sử dụng được tính năng này.
          </div>
        )}
      </div>
    </AppShell>
  );
}
