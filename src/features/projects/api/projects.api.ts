import { apiRequest } from "@/lib/api/client";
import {
  CreateProjectPayload,
  Project,
  ProjectQuery,
  UpdateProjectPayload,
} from "../types/project.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type WorkflowTemplate = { id: string; name: string; description: string | null; is_system: boolean | number };

export function getWorkflowTemplates(workspaceId: string) {
  return apiRequest<ApiResponse<{ items: WorkflowTemplate[] }>>(`/workspaces/${workspaceId}/projects/workflow-templates`);
}

export function createWorkflowTemplate(workspaceId: string, payload: { name: string; description?: string; statuses: Project["workflowStatuses"]; transitions: Project["workflowTransitions"] }) {
  return apiRequest<ApiResponse<{ id: string }>>(`/workspaces/${workspaceId}/projects/workflow-templates`, { method: "POST", body: payload });
}

export function applyWorkflowTemplate(workspaceId: string, projectId: string, templateId: string) {
  return apiRequest<ApiResponse<{ project: Project }>>(`/workspaces/${workspaceId}/projects/${projectId}/workflow-template/${templateId}`, { method: "PATCH" });
}

export function deleteWorkflowTemplate(workspaceId: string, templateId: string) {
  return apiRequest<ApiResponse<{ affected: number }>>(`/workspaces/${workspaceId}/projects/workflow-templates/${templateId}`, { method: "DELETE" });
}

export function createProject(
  workspaceId: string,
  payload: CreateProjectPayload,
) {
  return apiRequest<ApiResponse<{ project: Project }>>(
    `/workspaces/${workspaceId}/projects`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getProjects(
  workspaceId: string,
  query: ProjectQuery = {},
) {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();

  return apiRequest<
    ApiResponse<{
      items: Project[];
      meta: { total: number; page: number; limit: number };
    }>
  >(`/workspaces/${workspaceId}/projects${search ? `?${search}` : ""}`);
}

export function getProjectDetail(
  workspaceId: string,
  projectId: string,
) {
  return apiRequest<ApiResponse<{ project: Project }>>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
  );
}

export function updateProject(
  workspaceId: string,
  projectId: string,
  payload: UpdateProjectPayload,
) {
  return apiRequest<ApiResponse<{ project: Project }>>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function archiveProject(
  workspaceId: string,
  projectId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `/workspaces/${workspaceId}/projects/${projectId}/archive`,
    {
      method: "PATCH",
    },
  );
}

export function completeProject(
  workspaceId: string,
  projectId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `/workspaces/${workspaceId}/projects/${projectId}/complete`,
    {
      method: "PATCH",
    },
  );
}
