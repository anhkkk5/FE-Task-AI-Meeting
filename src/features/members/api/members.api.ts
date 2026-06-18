import { apiRequest } from "@/lib/api/client";
import {
  AddMemberPayload,
  ChangeMemberRolePayload,
  MyWorkspaceRole,
  WorkspaceMember,
} from "../types/member.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function getWorkspaceMembers(token: string, workspaceId: string) {
  return apiRequest<ApiResponse<{ items: WorkspaceMember[] }>>(
    `/workspaces/${workspaceId}/members`,
    {
      token,
    },
  );
}

export function getMyWorkspaceRole(token: string, workspaceId: string) {
  return apiRequest<ApiResponse<MyWorkspaceRole>>(
    `/workspaces/${workspaceId}/members/me`,
    {
      token,
    },
  );
}

export function addWorkspaceMember(
  token: string,
  workspaceId: string,
  payload: AddMemberPayload,
) {
  return apiRequest<ApiResponse<{ member: WorkspaceMember }>>(
    `/workspaces/${workspaceId}/members`,
    {
      method: "POST",
      token,
      body: payload,
    },
  );
}

export function changeWorkspaceMemberRole(
  token: string,
  workspaceId: string,
  memberId: string,
  payload: ChangeMemberRolePayload,
) {
  return apiRequest<ApiResponse<{ member: WorkspaceMember }>>(
    `/workspaces/${workspaceId}/members/${memberId}/role`,
    {
      method: "PATCH",
      token,
      body: payload,
    },
  );
}

export function removeWorkspaceMember(
  token: string,
  workspaceId: string,
  memberId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `/workspaces/${workspaceId}/members/${memberId}/remove`,
    {
      method: "PATCH",
      token,
    },
  );
}
