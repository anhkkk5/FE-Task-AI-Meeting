import { apiRequest } from "@/lib/api/client";
import {
  CreateDailyUpdatePayload,
  DailyUpdate,
  DailyUpdateQuery,
  UpdateDailyUpdatePayload,
} from "../types/daily-update.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function dailyUpdateBasePath(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/daily-updates`;
}

function buildDailyUpdateSearch(query: DailyUpdateQuery) {
  const params = new URLSearchParams();

  if (query.date) params.set("date", query.date);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.sprintId) params.set("sprintId", query.sprintId);
  if (query.memberId) params.set("memberId", query.memberId);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();
  return search ? `?${search}` : "";
}

export function createDailyUpdate(
  workspaceId: string,
  projectId: string,
  payload: CreateDailyUpdatePayload,
) {
  return apiRequest<ApiResponse<{ dailyUpdate: DailyUpdate }>>(
    dailyUpdateBasePath(workspaceId, projectId),
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMyDailyUpdates(
  workspaceId: string,
  projectId: string,
  query: DailyUpdateQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: DailyUpdate[];
      meta: { total: number; page: number; limit: number };
    }>
  >(
    `${dailyUpdateBasePath(workspaceId, projectId)}/me${buildDailyUpdateSearch(
      query,
    )}`,
  );
}

export function getPendingDailyUpdateDraft(
  workspaceId: string,
  projectId: string,
  updateDate: string,
) {
  const query = new URLSearchParams({ date: updateDate });
  return apiRequest<ApiResponse<{ draft: DailyUpdate | null }>>(
    `${dailyUpdateBasePath(workspaceId, projectId)}/draft/pending?${query}`,
  );
}

export function getTeamDailyUpdates(
  workspaceId: string,
  projectId: string,
  query: DailyUpdateQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: DailyUpdate[];
      meta: { total: number; page: number; limit: number };
    }>
  >(`${dailyUpdateBasePath(workspaceId, projectId)}${buildDailyUpdateSearch(query)}`);
}

export function getDailyUpdateDetail(
  workspaceId: string,
  projectId: string,
  dailyUpdateId: string,
) {
  return apiRequest<ApiResponse<{ dailyUpdate: DailyUpdate }>>(
    `${dailyUpdateBasePath(workspaceId, projectId)}/${dailyUpdateId}`,
  );
}

export function updateDailyUpdate(
  workspaceId: string,
  projectId: string,
  dailyUpdateId: string,
  payload: UpdateDailyUpdatePayload,
) {
  return apiRequest<ApiResponse<{ dailyUpdate: DailyUpdate }>>(
    `${dailyUpdateBasePath(workspaceId, projectId)}/${dailyUpdateId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function archiveDailyUpdate(
  workspaceId: string,
  projectId: string,
  dailyUpdateId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `${dailyUpdateBasePath(workspaceId, projectId)}/${dailyUpdateId}/archive`,
    {
      method: "PATCH",
    },
  );
}
