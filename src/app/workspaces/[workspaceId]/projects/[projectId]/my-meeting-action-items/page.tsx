"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyMeetingActionItems } from "@/features/ai-reports/api/ai-personalized-meeting-summary.api";
import { MyMeetingActionItems } from "@/features/ai-reports/components/MyMeetingActionItems";
import {
  MyMeetingActionItem,
  PersonalizedMeetingActionItemsQuery,
} from "@/features/ai-reports/types/personalized-meeting-summary.type";
import { getMeetings } from "@/features/meetings/api/meetings.api";
import { Meeting } from "@/features/meetings/types/meeting.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

type ActionItemsMeta = {
  total: number;
  page: number;
  limit: number;
};

export default function MyMeetingActionItemsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [items, setItems] = useState<MyMeetingActionItem[]>([]);
  const [meta, setMeta] = useState<ActionItemsMeta>({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [query, setQuery] =
    useState<PersonalizedMeetingActionItemsQuery>({
      page: 1,
      limit: 20,
    });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, meetingsRes, sprintsRes, actionItemsRes] =
        await Promise.all([
          getProjectDetail(params.workspaceId, params.projectId),
          getMeetings(params.workspaceId, params.projectId, {
            page: 1,
            limit: 100,
          }),
          getSprints(params.workspaceId, params.projectId, {
            page: 1,
            limit: 100,
          }),
          getMyMeetingActionItems(
            params.workspaceId,
            params.projectId,
            query,
          ),
        ]);

      setProject(projectRes.data.project);
      setMeetings(meetingsRes.data.items);
      setSprints(sprintsRes.data.items);
      setItems(actionItemsRes.data.items);
      setMeta(actionItemsRes.data.meta);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Load meeting action items failed.",
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

  function patchQuery(next: Partial<PersonalizedMeetingActionItemsQuery>) {
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
                AI meeting action items
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                My meeting action items
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-zinc-500">
                These items are extracted from your personalized meeting
                summaries. No Jira-style task is created until you do it
                manually.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings`}
              >
                Meetings
              </Link>
              <button
                className="h-10 rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white transition hover:bg-zinc-800"
                type="button"
                onClick={() => void loadData()}
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[180px_180px_220px_220px_1fr_auto]">
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            From date
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
            To date
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
              <option value="">All sprints</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Meeting
            <select
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-800 outline-none transition focus:border-blue-600"
              value={query.meetingId ?? ""}
              onChange={(event) =>
                patchQuery({ meetingId: event.target.value || undefined })
              }
            >
              <option value="">All meetings</option>
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.title}
                </option>
              ))}
            </select>
          </label>
          <div className="hidden lg:block"></div>
          <button
            className="h-11 self-end rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
            type="button"
            onClick={() => setQuery({ page: 1, limit: 20 })}
          >
            Clear
          </button>
        </section>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
          <span>{meta.total} action items</span>
          <span>
            Page {meta.page} / limit {meta.limit}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <MyMeetingActionItems
            items={items}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
          />
        )}
      </div>
    </AppShell>
  );
}
