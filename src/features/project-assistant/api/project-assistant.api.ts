import { apiRequest } from "@/lib/api/client";
import {
  ProjectAssistantAnswer,
  SprintRiskAssessment,
} from "../types/project-assistant.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function assistantBasePath(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/ai/assistant`;
}

export function askProjectAssistant(
  workspaceId: string,
  projectId: string,
  payload: { question: string; sprintId?: string },
) {
  return apiRequest<ApiResponse<ProjectAssistantAnswer>>(
    `${assistantBasePath(workspaceId, projectId)}/ask`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getSprintRisk(
  workspaceId: string,
  projectId: string,
  sprintId: string,
) {
  return apiRequest<ApiResponse<SprintRiskAssessment>>(
    `${assistantBasePath(workspaceId, projectId)}/sprints/${sprintId}/risk`,
  );
}
