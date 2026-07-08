"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  generateMemberPersonalDailyReport,
  generateMyPersonalDailyReport,
} from "@/features/ai-reports/api/ai-reports.api";
import { PersonalReportGenerateForm } from "@/features/ai-reports/components/PersonalReportGenerateForm";
import { GeneratePersonalReportPayload } from "@/features/ai-reports/types/ai-report.type";
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
const generatorRoles = [...managerRoles, "MEMBER"];

export default function GeneratePersonalAiReportPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canManage = managerRoles.includes(myRole);
  const canGenerate = generatorRoles.includes(myRole);

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, membersRes, roleRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
        getWorkspaceMembers(params.workspaceId),
        getMyWorkspaceRole(params.workspaceId),
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMembers(membersRes.data.items);
      setMyRole(roleRes.data.role);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tai du lieu tao AI report that bai.",
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

  async function handleSubmit(
    payload: GeneratePersonalReportPayload,
    memberId?: string,
  ) {
    if (!canGenerate) {
      setMessage("VIEWER khong duoc tao AI personal report.");
      return;
    }

    try {
      const response =
        memberId && canManage
          ? await generateMemberPersonalDailyReport(
              params.workspaceId,
              params.projectId,
              memberId,
              payload,
            )
          : await generateMyPersonalDailyReport(
              params.workspaceId,
              params.projectId,
              payload,
            );

      router.push(
        `/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/personal/${response.data.report.id}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tao AI report that bai.",
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
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                AI personal report
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Tao bao cao ca nhan
              </h1>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                {project?.name ?? "Project"} {myRole ? `- Vai tro: ${myRole}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team`}
              >
                Team reports
              </Link>
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/personal`}
              >
                Danh sach report
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
            <PersonalReportGenerateForm
              canManage={canManage}
              members={members}
              sprints={sprints}
              submitLabel="Tao AI report"
              onSubmit={handleSubmit}
            />
          </section>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-semibold text-zinc-700 shadow-sm">
            Ban can la OWNER, SCRUM_MASTER, PROJECT_MANAGER hoac MEMBER de tao
            AI report. VIEWER khong duoc su dung tinh nang nay.
          </div>
        )}
      </div>
    </AppShell>
  );
}
