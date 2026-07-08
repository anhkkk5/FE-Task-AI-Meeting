import { apiRequest } from "@/lib/api/client";
import {
  AiPersonalizedMeetingSummary,
  GeneratePersonalizedMeetingSummaryPayload,
  MyMeetingActionItem,
  PersonalizedMeetingActionItemsQuery,
} from "../types/personalized-meeting-summary.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function aiBasePath(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/ai`;
}

function meetingAiBasePath(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return `/workspaces/${workspaceId}/projects/${projectId}/meetings/${meetingId}/ai`;
}

function buildActionItemsSearch(
  query: PersonalizedMeetingActionItemsQuery = {},
) {
  const params = new URLSearchParams();

  if (query.meetingId) params.set("meetingId", query.meetingId);
  if (query.sprintId) params.set("sprintId", query.sprintId);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();
  return search ? `?${search}` : "";
}

export function generateMyPersonalizedMeetingSummary(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: GeneratePersonalizedMeetingSummaryPayload = {},
) {
  return apiRequest<
    ApiResponse<{ summary: AiPersonalizedMeetingSummary }>
  >(
    `${meetingAiBasePath(
      workspaceId,
      projectId,
      meetingId,
    )}/personalized-summary/me`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function generateMemberPersonalizedMeetingSummary(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  memberId: string,
  payload: GeneratePersonalizedMeetingSummaryPayload = {},
) {
  return apiRequest<
    ApiResponse<{ summary: AiPersonalizedMeetingSummary }>
  >(
    `${meetingAiBasePath(
      workspaceId,
      projectId,
      meetingId,
    )}/personalized-summary/member/${memberId}`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function generateAllPersonalizedMeetingSummaries(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: GeneratePersonalizedMeetingSummaryPayload = {},
) {
  return apiRequest<
    ApiResponse<{ items: AiPersonalizedMeetingSummary[] }>
  >(
    `${meetingAiBasePath(
      workspaceId,
      projectId,
      meetingId,
    )}/personalized-summaries`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMyPersonalizedMeetingSummary(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<
    ApiResponse<{ summary: AiPersonalizedMeetingSummary }>
  >(
    `${meetingAiBasePath(
      workspaceId,
      projectId,
      meetingId,
    )}/personalized-summary/me`,
  );
}

export function getMemberPersonalizedMeetingSummary(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  memberId: string,
) {
  return apiRequest<
    ApiResponse<{ summary: AiPersonalizedMeetingSummary }>
  >(
    `${meetingAiBasePath(
      workspaceId,
      projectId,
      meetingId,
    )}/personalized-summary/member/${memberId}`,
  );
}

export function getPersonalizedMeetingSummaryDetail(
  workspaceId: string,
  projectId: string,
  summaryId: string,
) {
  return apiRequest<
    ApiResponse<{ summary: AiPersonalizedMeetingSummary }>
  >(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/personalized-meeting-summaries/${summaryId}`,
  );
}

export function getMyMeetingActionItems(
  workspaceId: string,
  projectId: string,
  query: PersonalizedMeetingActionItemsQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: MyMeetingActionItem[];
      meta: { total: number; page: number; limit: number };
    }>
  >(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/meeting-action-items/me${buildActionItemsSearch(query)}`,
  );
}
