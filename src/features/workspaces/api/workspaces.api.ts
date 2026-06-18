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
  token: string,
  payload: CreateWorkspacePayload,
) {
  return apiRequest<ApiResponse<{ workspace: Workspace }>>("/workspaces", {
    method: "POST",
    token,
    body: payload,
  });
}

export function getMyWorkspaces(token: string, status?: WorkspaceStatus) {
  const query = status ? `?status=${status}` : "";

  return apiRequest<ApiResponse<{ items: Workspace[] }>>(
    `/workspaces${query}`,
    {
      token,
    },
  );
}

export function getWorkspaceDetail(token: string, workspaceId: string) {
  return apiRequest<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
    {
      token,
    },
  );
}

export function updateWorkspace(
  token: string,
  workspaceId: string,
  payload: UpdateWorkspacePayload,
) {
  return apiRequest<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
    {
      method: "PATCH",
      token,
      body: payload,
    },
  );
}

export function archiveWorkspace(token: string, workspaceId: string) {
  return apiRequest<ApiResponse<null>>(`/workspaces/${workspaceId}/archive`, {
    method: "PATCH",
    token,
  });
}
