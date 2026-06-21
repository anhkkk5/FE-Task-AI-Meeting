import { apiRequest } from "@/lib/api/client";
import {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  Workspace,
  WorkspaceStatus,
} from "../types/workspace.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function createWorkspace(
  payload: CreateWorkspacePayload,
) {
  return apiRequest<ApiResponse<{ workspace: Workspace }>>("/workspaces", {
    method: "POST",
    body: payload,
  });
}

export function getMyWorkspaces(status?: WorkspaceStatus) {
  const query = status ? `?status=${status}` : "";

  return apiRequest<ApiResponse<{ items: Workspace[] }>>(
    `/workspaces${query}`,
  );
}

export function getWorkspaceDetail(workspaceId: string) {
  return apiRequest<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
  );
}

export function updateWorkspace(
  workspaceId: string,
  payload: UpdateWorkspacePayload,
) {
  return apiRequest<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function archiveWorkspace(workspaceId: string) {
  return apiRequest<ApiResponse<null>>(`/workspaces/${workspaceId}/archive`, {
    method: "PATCH",
  });
}
