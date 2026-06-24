"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getTeamDailyUpdates } from "@/features/daily-updates/api/daily-updates.api";
import { DailyUpdateFilter } from "@/features/daily-updates/components/DailyUpdateFilter";
import { DailyUpdateList } from "@/features/daily-updates/components/DailyUpdateList";
import {
  DailyUpdate,
  DailyUpdateQuery,
} from "@/features/daily-updates/types/daily-update.type";
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

export default function TeamDailyUpdatesPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [items, setItems] = useState<DailyUpdate[]>([]);
  const [myRole, setMyRole] = useState("");
  const [query, setQuery] = useState<DailyUpdateQuery>({
    page: 1,
    limit: 20,
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canViewTeam = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
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

      if (!managerRoles.includes(roleRes.data.role)) {
        setItems([]);
        setMessage(
          "Chỉ OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER được xem daily update của team.",
        );
        return;
      }

      const dailyUpdatesRes = await getTeamDailyUpdates(
        params.workspaceId,
        params.projectId,
        query,
      );
      setItems(dailyUpdatesRes.data.items);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tải daily update của team thất bại.",
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
                Team daily
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Daily update của team
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-500">
                Scrum master và project manager xem tiến độ theo ngày, sprint và
                thành viên.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/me`}
              >
                Của tôi
              </Link>
              <Link
                className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/create`}
              >
                Viết daily update
              </Link>
            </div>
          </div>
        </section>

        {canViewTeam ? (
          <DailyUpdateFilter
            members={members}
            query={query}
            showMemberFilter
            sprints={sprints}
            onChange={setQuery}
            onRefresh={() => void loadData()}
          />
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
        ) : canViewTeam ? (
          <DailyUpdateList
            emptyText="Chưa có daily update nào của team trong bộ lọc hiện tại."
            items={items}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
