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

export function getProjectAssistantHistory(workspaceId: string, projectId: string) {
  return apiRequest<ApiResponse<{ items: Array<{ id: string; role: "USER" | "ASSISTANT"; content: string; sources?: ProjectAssistantAnswer["sources"]; actionDraft?: ProjectAssistantAnswer["actionDraft"] }> }>>(`${assistantBasePath(workspaceId, projectId)}/history`);
}

export function clearProjectAssistantHistory(workspaceId: string, projectId: string) {
  return apiRequest<ApiResponse<null>>(`${assistantBasePath(workspaceId, projectId)}/history`, { method: "DELETE" });
}
