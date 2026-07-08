"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  generateAllPersonalizedMeetingSummaries,
  generateMemberPersonalizedMeetingSummary,
  generateMyPersonalizedMeetingSummary,
  getMemberPersonalizedMeetingSummary,
  getMyPersonalizedMeetingSummary,
} from "@/features/ai-reports/api/ai-personalized-meeting-summary.api";
import { PersonalizedMeetingSummaryDetail } from "@/features/ai-reports/components/PersonalizedMeetingSummaryDetail";
import { PersonalizedMeetingSummaryGenerateButton } from "@/features/ai-reports/components/PersonalizedMeetingSummaryGenerateButton";
import { PersonalizedSummaryList } from "@/features/ai-reports/components/PersonalizedSummaryList";
import { AiPersonalizedMeetingSummary } from "@/features/ai-reports/types/personalized-meeting-summary.type";
import { getMeetingDetail } from "@/features/meetings/api/meetings.api";
import { Meeting } from "@/features/meetings/types/meeting.type";
import {
  getMyWorkspaceRole,
  getWorkspaceMembers,
} from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];
const readerRoles = [...managerRoles, "MEMBER"];

function isNotFound(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("not found");
}

type GenerateMode = "me" | "member" | "all";

export default function PersonalizedMeetingSummaryPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    meetingId: string;
  }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [summary, setSummary] =
    useState<AiPersonalizedMeetingSummary | null>(null);
  const [generatedItems, setGeneratedItems] = useState<
    AiPersonalizedMeetingSummary[]
  >([]);
  const [myRole, setMyRole] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canManage = managerRoles.includes(myRole);
  const canRead = readerRoles.includes(myRole);
  const hasMeetingSummary = Boolean(meeting?.mongoSummaryId);
  const activeMembers = members.filter((member) => member.status === "ACTIVE");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, meetingRes, membersRes, roleRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getMeetingDetail(
          params.workspaceId,
          params.projectId,
          params.meetingId,
        ),
        getWorkspaceMembers(params.workspaceId),
        getMyWorkspaceRole(params.workspaceId),
      ]);
      const role = roleRes.data.role;

      setProject(projectRes.data.project);
      setMeeting(meetingRes.data.meeting);
      setMembers(membersRes.data.items);
      setMyRole(role);
      setGeneratedItems([]);

      if (!readerRoles.includes(role)) {
        setSummary(null);
        setMessage("VIEWER can not generate or view personalized summaries.");
        return;
      }

      try {
        const summaryRes =
          managerRoles.includes(role) && selectedMemberId
            ? await getMemberPersonalizedMeetingSummary(
                params.workspaceId,
                params.projectId,
                params.meetingId,
                selectedMemberId,
              )
            : await getMyPersonalizedMeetingSummary(
                params.workspaceId,
                params.projectId,
                params.meetingId,
              );

        setSummary(summaryRes.data.summary);
      } catch (error) {
        if (isNotFound(error)) {
          setSummary(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Load personalized summary failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    params.meetingId,
    params.projectId,
    params.workspaceId,
    selectedMemberId,
  ]);

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

  async function handleGenerate(
    mode: GenerateMode,
    forceRegenerate: boolean,
  ) {
    setIsGenerating(true);
    setMessage("");

    try {
      if (mode === "all") {
        const response = await generateAllPersonalizedMeetingSummaries(
          params.workspaceId,
          params.projectId,
          params.meetingId,
          { forceRegenerate },
        );
        const items = response.data.items;
        const preferredSummary =
          items.find((item) => item.userId === selectedMemberId) ??
          items.find((item) => item.userId === user?.id) ??
          items[0] ??
          null;

        setGeneratedItems(items);
        setSummary(preferredSummary);
        setMessage(`Generated ${items.length} participant summaries.`);
        return;
      }

      const response =
        mode === "member" && selectedMemberId
          ? await generateMemberPersonalizedMeetingSummary(
              params.workspaceId,
              params.projectId,
              params.meetingId,
              selectedMemberId,
              { forceRegenerate },
            )
          : await generateMyPersonalizedMeetingSummary(
              params.workspaceId,
              params.projectId,
              params.meetingId,
              { forceRegenerate },
            );

      setSummary(response.data.summary);
      setGeneratedItems([]);
      setMessage(
        forceRegenerate
          ? "Regenerated personalized summary."
          : "Loaded personalized summary.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Generate personalized summary failed.",
      );
    } finally {
      setIsGenerating(false);
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
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                AI personalized meeting summary
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                {meeting?.title ?? "Personalized summary"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-zinc-500">
                This view creates a participant-specific summary from the
                existing meeting summary. It does not update tasks, sprints or
                projects automatically.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <PersonalizedMeetingSummaryGenerateButton
                canManage={canManage}
                disabled={isGenerating || isLoading || !canRead}
                hasMeetingSummary={hasMeetingSummary}
                hasSummary={Boolean(summary)}
                selectedMemberId={selectedMemberId}
                onGenerate={(mode, force) => void handleGenerate(mode, force)}
              />
              <div className="flex flex-wrap gap-2">
                <Link
                  className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}/summary`}
                >
                  Meeting summary
                </Link>
                <Link
                  className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/my-meeting-action-items`}
                >
                  My action items
                </Link>
              </div>
            </div>
          </div>
        </section>

        {canManage ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <label className="grid max-w-md gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Participant view
              <select
                className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-zinc-800 outline-none transition focus:border-blue-600"
                value={selectedMemberId}
                onChange={(event) => setSelectedMemberId(event.target.value)}
              >
                <option value="">My personalized summary</option>
                {activeMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName ?? member.email ?? member.userId}
                  </option>
                ))}
              </select>
            </label>
          </section>
        ) : null}

        {!hasMeetingSummary ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Generate the base meeting summary before generating personalized
            participant summaries.
          </div>
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
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              {summary ? (
                <PersonalizedMeetingSummaryDetail
                  projectId={params.projectId}
                  summary={summary}
                  workspaceId={params.workspaceId}
                />
              ) : (
                <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center shadow-sm">
                  <p className="text-sm font-bold text-zinc-700">
                    No personalized summary yet.
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    Generate one after the base meeting summary is available.
                  </p>
                </section>
              )}
            </div>
            <PersonalizedSummaryList
              items={generatedItems}
              projectId={params.projectId}
              workspaceId={params.workspaceId}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
