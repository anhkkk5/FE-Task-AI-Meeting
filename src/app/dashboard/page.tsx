"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardAiMeetingSummary } from "@/features/dashboard/components/DashboardAiMeetingSummary";
import { DashboardMetricCards } from "@/features/dashboard/components/DashboardMetricCards";
import { DashboardSprintBanner } from "@/features/dashboard/components/DashboardSprintBanner";
import {
  DashboardUpcomingMeeting,
  RealMeetingItem,
} from "@/features/dashboard/components/DashboardUpcomingMeeting";
import { getMeetings } from "@/features/meetings/api/meetings.api";
import { getMyWork } from "@/features/my-work/api/my-work.api";
import { MyWorkData } from "@/features/my-work/types/my-work.type";
import { getProjects } from "@/features/projects/api/projects.api";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  getWorkspaceDashboard,
  getWorkspacesOverview,
} from "@/features/stats/api/stats.api";
import { WorkspacesOverview } from "@/features/stats/types/stats.type";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types/task.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

type ProjectOption = {
  id: string;
  name: string;
  keyCode: string;
  workspaceId: string;
};

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [overview, setOverview] = useState<WorkspacesOverview | null>(null);
  const [myWorkData, setMyWorkData] = useState<MyWorkData | null>(null);
  const [realMeetings, setRealMeetings] = useState<RealMeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setMessage("");

    try {
      // 1. Fetch workspaces, overview stats, and user tasks concurrently
      const [workspacesRes, overviewRes, myWorkRes] = await Promise.allSettled([
        getMyWorkspaces("ACTIVE"),
        getWorkspacesOverview(),
        getMyWork(user.id),
      ]);

      let loadedWorkspaces: Workspace[] = [];

      if (workspacesRes.status === "fulfilled") {
        loadedWorkspaces = workspacesRes.value.data.items;
        setWorkspaces(loadedWorkspaces);
      } else {
        setWorkspaces([]);
        setMessage("Tải danh sách workspace thất bại.");
      }

      if (overviewRes.status === "fulfilled") {
        setOverview(overviewRes.value.data);
      }

      if (myWorkRes.status === "fulfilled") {
        setMyWorkData(myWorkRes.value);
      }

      // 2. Direct fetch of ALL projects across ALL workspaces for the dropdown
      const allProjects: ProjectOption[] = [];
      if (loadedWorkspaces.length > 0) {
        const projectResults = await Promise.allSettled(
          loadedWorkspaces.map((w) => getProjects(w.id, { limit: 50 })),
        );

        projectResults.forEach((res, idx) => {
          if (res.status === "fulfilled" && res.value.data.items) {
            res.value.data.items.forEach((p) => {
              allProjects.push({
                id: p.id,
                name: p.name,
                keyCode: p.keyCode,
                workspaceId: loadedWorkspaces[idx].id,
              });
            });
          }
        });

        setProjects(allProjects);

        const targetProjectId =
          selectedProjectId && allProjects.some((p) => p.id === selectedProjectId)
            ? selectedProjectId
            : allProjects.length > 0
            ? allProjects[0].id
            : "";

        setSelectedProjectId(targetProjectId);

        // 3. Query real UPCOMING meetings across projects (Lọc ngày giờ >= hôm nay)
        try {
          const meetingResults = await Promise.allSettled(
            allProjects.slice(0, 5).map((p) =>
              getMeetings(p.workspaceId, p.id, {
                page: 1,
                limit: 10,
              }),
            ),
          );

          const collectedMeetings: RealMeetingItem[] = [];
          const now = Date.now();
          // Buffer 12 hours for ongoing meetings today
          const timeBuffer = 12 * 60 * 60 * 1000;

          meetingResults.forEach((res, idx) => {
            if (res.status === "fulfilled" && res.value.data?.items) {
              const projInfo = allProjects[idx];
              res.value.data.items.forEach((m) => {
                const meetingStartTime = m.startTime
                  ? new Date(m.startTime).getTime()
                  : 0;

                // FIX LỌC CUỘC HỌP: Chỉ lấy cuộc họp có thời gian >= hôm nay (không lấy quá khứ 27/7)
                if (
                  meetingStartTime >= now - timeBuffer &&
                  m.status !== "CANCELLED" &&
                  m.status !== "COMPLETED"
                ) {
                  collectedMeetings.push({
                    id: m.id,
                    title: m.title,
                    workspaceId: projInfo.workspaceId,
                    projectId: projInfo.id,
                    projectName: projInfo.name,
                    startTime: m.startTime,
                    endTime: m.endTime,
                    meetingType: m.meetingType,
                    status: m.status,
                  });
                }
              });
            }
          });

          // Sort by start time ascending (cuộc họp sắp diễn ra nhất ở đầu)
          collectedMeetings.sort(
            (a, b) =>
              new Date(a.startTime || 0).getTime() -
              new Date(b.startTime || 0).getTime(),
          );

          setRealMeetings(collectedMeetings);
        } catch {
          setRealMeetings([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProjectId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Load Sprints & Tasks when selectedProjectId changes
  const loadProjectSprintsAndTasks = useCallback(
    async (projId: string) => {
      if (!projId) {
        setSprints([]);
        setProjectTasks([]);
        return;
      }

      const proj = projects.find((p) => p.id === projId);
      if (!proj) return;

      setIsProjectLoading(true);

      try {
        const [sprintsRes, tasksRes] = await Promise.allSettled([
          getSprints(proj.workspaceId, proj.id, { limit: 50 }),
          getTasks(proj.workspaceId, proj.id, { limit: 100 }),
        ]);

        if (sprintsRes.status === "fulfilled") {
          setSprints(sprintsRes.value.data.items);
        } else {
          setSprints([]);
        }

        if (tasksRes.status === "fulfilled") {
          setProjectTasks(tasksRes.value.data.items);
        } else {
          setProjectTasks([]);
        }
      } finally {
        setIsProjectLoading(false);
      }
    },
    [projects],
  );

  useEffect(() => {
    if (selectedProjectId) {
      void loadProjectSprintsAndTasks(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectSprintsAndTasks]);

  // Real task metrics
  const { totalTasks, doneTasks, inProgressTasks, overdueTasks } = useMemo(() => {
    if (!myWorkData?.tasks) {
      return { totalTasks: 0, doneTasks: 0, inProgressTasks: 0, overdueTasks: 0 };
    }
    const tasks = myWorkData.tasks;
    const now = Date.now();

    return {
      totalTasks: tasks.length,
      doneTasks: tasks.filter((t) => t.status === "DONE").length,
      inProgressTasks: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      overdueTasks: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== "DONE",
      ).length,
    };
  }, [myWorkData]);

  const primaryWorkspace = workspaces[0];

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Banner thông báo lỗi nếu có */}
        {message ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-bold text-rose-800 shadow-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            {message}
          </div>
        ) : null}

        {/* 1. Sprints & Tasks Accordion Banner Card (Cấu trúc cây Sprints đóng/mở ra các Task) */}
        <DashboardSprintBanner
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            void loadProjectSprintsAndTasks(id);
          }}
          sprints={sprints}
          tasks={projectTasks}
          isLoading={isLoading || isProjectLoading}
        />

        {/* 2. 4 Metric Cards KPI (Công việc, Đã hoàn thành, Đang thực hiện, Quá hạn) */}
        <DashboardMetricCards
          summary={overview?.summary ?? null}
          totalTasks={totalTasks}
          doneTasks={doneTasks}
          inProgressTasks={inProgressTasks}
          overdueTasks={overdueTasks}
          isPending={isLoading && !overview}
        />

        {/* 3. Bottom Grid 2 Columns: Cuộc họp sắp tới (Lọc chính xác >= Hôm nay 1/8) & Trợ lý AI */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardUpcomingMeeting
            meetings={realMeetings}
            isLoading={isLoading}
            workspaceId={primaryWorkspace?.id}
          />
          <DashboardAiMeetingSummary
            workspaceId={primaryWorkspace?.id}
            projectId={selectedProjectId}
          />
        </div>
      </div>
    </AppShell>
  );
}
