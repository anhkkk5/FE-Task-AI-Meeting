"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMeetings } from "@/features/meetings/api/meetings.api";
import { MeetingList } from "@/features/meetings/components/MeetingList";
import {
  Meeting,
  MeetingQuery,
  MeetingStatus,
  MeetingType,
} from "@/features/meetings/types/meeting.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

const statusOptions: MeetingStatus[] = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
];

const typeOptions: MeetingType[] = [
  "SPRINT_PLANNING",
  "DAILY_SCRUM",
  "SPRINT_REVIEW",
  "RETROSPECTIVE",
  "GENERAL",
];

export default function MeetingsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [items, setItems] = useState<Meeting[]>([]);
  const [myRole, setMyRole] = useState("");
  const [query, setQuery] = useState<MeetingQuery>({ page: 1, limit: 20 });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canManage = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, roleRes, meetingsRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
        getMyWorkspaceRole(params.workspaceId),
        getMeetings(params.workspaceId, params.projectId, query),
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMyRole(roleRes.data.role);
      setItems(meetingsRes.data.items);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tai meetings that bai.",
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

  function patchQuery(next: Partial<MeetingQuery>) {
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
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Meetings
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Meeting trong project
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-500">
                Quan ly lich hop, participant va transcript theo tung project
                hoac sprint.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/create`}
                >
                  Tao meeting
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_180px_180px_220px_auto]">
          <input
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600"
            placeholder="Tim meeting..."
            value={query.keyword ?? ""}
            onChange={(event) => patchQuery({ keyword: event.target.value })}
          />
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600"
            value={query.status ?? ""}
            onChange={(event) =>
              patchQuery({
                status: (event.target.value || undefined) as
                  | MeetingStatus
                  | undefined,
              })
            }
          >
            <option value="">Tat ca status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600"
            value={query.meetingType ?? ""}
            onChange={(event) =>
              patchQuery({
                meetingType: (event.target.value || undefined) as
                  | MeetingType
                  | undefined,
              })
            }
          >
            <option value="">Tat ca loai</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600"
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
          <button
            className="h-11 rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white transition hover:bg-zinc-800"
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

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <MeetingList
            emptyText="Chua co meeting nao trong bo loc hien tai."
            items={items}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
          />
        )}
      </div>
    </AppShell>
  );
}
