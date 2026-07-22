"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectAssistantWorkspace } from "@/features/project-assistant/components/ProjectAssistantWorkspace";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectAssistantPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const [projectResponse, sprintsResponse] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
      ]);
      setProject(projectResponse.data.project);
      setSprints(
        sprintsResponse.data.items.filter(
          (sprint) => sprint.status === "ACTIVE" || sprint.status === "PLANNED",
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu trợ lý dự án.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user) void loadData();
  }, [loadData, user]);

  if (authLoading) return null;

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      {isLoading ? (
        <div className="flex min-h-96 items-center justify-center text-sm text-[#6b778c]">
          Đang tải trợ lý dự án...
        </div>
      ) : message ? (
        <div className="border border-[#ffd2cc] bg-[#fff4f2] px-4 py-3 text-sm text-[#ae2a19]">
          {message}
        </div>
      ) : (
        <ProjectAssistantWorkspace
          projectId={params.projectId}
          sprints={sprints}
          workspaceId={params.workspaceId}
        />
      )}
    </AppShell>
  );
}
