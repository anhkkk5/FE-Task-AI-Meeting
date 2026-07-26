import { apiRequest } from "@/lib/api/client";
import {
  AiMeetingSummary,
  AiPersonalReport,
  AiTeamReport,
  AiReportsQuery,
  ApproveMeetingActionItemPayload,
  GenerateMeetingSummaryPayload,
  GeneratePersonalReportPayload,
  GenerateTeamReportPayload,
  MeetingSummariesQuery,
  ReportAutomationStatus,
  ReviewedMeetingActionItem,
  UpdateTeamReportPayload,
} from "../types/ai-report.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function aiBasePath(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/ai`;
}

function buildAiReportsSearch(query: AiReportsQuery = {}) {
  const params = new URLSearchParams();

  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.sprintId) params.set("sprintId", query.sprintId);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();
  return search ? `?${search}` : "";
}

function meetingBasePath(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return `/workspaces/${workspaceId}/projects/${projectId}/meetings/${meetingId}/ai`;
}

function buildMeetingSummariesSearch(query: MeetingSummariesQuery = {}) {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();
  return search ? `?${search}` : "";
}

/**
 * Doc trang thai lich tu dong tao bao cao giao ban.
 *
 * Dung de hien thi cho nguoi dung biet bao cao duoc may tu tao theo lich,
 * thay vi de ho tuong phai bam tao thu cong.
 */
export function getReportAutomationStatus(
  workspaceId: string,
  projectId: string,
) {
  return apiRequest<ApiResponse<ReportAutomationStatus>>(
    `${aiBasePath(workspaceId, projectId)}/daily-report-automation`,
  );
}

export function generateMyPersonalDailyReport(
  workspaceId: string,
  projectId: string,
  payload: GeneratePersonalReportPayload,
) {
  return apiRequest<ApiResponse<{ report: AiPersonalReport }>>(
    `${aiBasePath(workspaceId, projectId)}/personal-daily-report`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function generateMemberPersonalDailyReport(
  workspaceId: string,
  projectId: string,
  memberId: string,
  payload: GeneratePersonalReportPayload,
) {
  return apiRequest<ApiResponse<{ report: AiPersonalReport }>>(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/personal-daily-report/member/${memberId}`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMyPersonalDailyReports(
  workspaceId: string,
  projectId: string,
  query: AiReportsQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: AiPersonalReport[];
      meta: { total: number; page: number; limit: number };
    }>
  >(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/personal-daily-reports/me${buildAiReportsSearch(query)}`,
  );
}

export function getMemberPersonalDailyReports(
  workspaceId: string,
  projectId: string,
  memberId: string,
  query: AiReportsQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: AiPersonalReport[];
      meta: { total: number; page: number; limit: number };
    }>
  >(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/personal-daily-reports/member/${memberId}${buildAiReportsSearch(query)}`,
  );
}

export function getPersonalDailyReportDetail(
  workspaceId: string,
  projectId: string,
  reportId: string,
) {
  return apiRequest<ApiResponse<{ report: AiPersonalReport }>>(
    `${aiBasePath(workspaceId, projectId)}/personal-daily-reports/${reportId}`,
  );
}

export function generateTeamDailyReport(
  workspaceId: string,
  projectId: string,
  payload: GenerateTeamReportPayload,
) {
  return apiRequest<ApiResponse<{ report: AiTeamReport }>>(
    `${aiBasePath(workspaceId, projectId)}/team-daily-report`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getTeamDailyReports(
  workspaceId: string,
  projectId: string,
  query: AiReportsQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: AiTeamReport[];
      meta: { total: number; page: number; limit: number };
    }>
  >(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/team-daily-reports${buildAiReportsSearch(query)}`,
  );
}

export function getLatestTeamDailyReport(
  workspaceId: string,
  projectId: string,
  query: AiReportsQuery = {},
) {
  return apiRequest<ApiResponse<{ report: AiTeamReport | null }>>(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/team-daily-reports/latest${buildAiReportsSearch(query)}`,
  );
}

export function getTeamDailyReportDetail(
  workspaceId: string,
  projectId: string,
  reportId: string,
) {
  return apiRequest<ApiResponse<{ report: AiTeamReport }>>(
    `${aiBasePath(workspaceId, projectId)}/team-daily-reports/${reportId}`,
  );
}

/**
 * Sua noi dung ban nhap do AI sinh.
 *
 * Chi gui nhung muc thuc su thay doi, backend giu nguyen phan con lai cua ban AI.
 */
export function updateTeamDailyReport(
  workspaceId: string,
  projectId: string,
  reportId: string,
  payload: UpdateTeamReportPayload,
) {
  return apiRequest<ApiResponse<{ report: AiTeamReport }>>(
    `${aiBasePath(workspaceId, projectId)}/team-daily-reports/${reportId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

/** Duyet ban nhap thanh bao cao chinh thuc, backend se gui mail cho ca nhom. */
export function approveTeamDailyReport(
  workspaceId: string,
  projectId: string,
  reportId: string,
) {
  return apiRequest<ApiResponse<{ report: AiTeamReport }>>(
    `${aiBasePath(
      workspaceId,
      projectId,
    )}/team-daily-reports/${reportId}/approve`,
    { method: "POST" },
  );
}

export function generateMeetingSummary(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: GenerateMeetingSummaryPayload = {},
) {
  return apiRequest<ApiResponse<{ summary: AiMeetingSummary }>>(
    `${meetingBasePath(workspaceId, projectId, meetingId)}/summary`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMeetingSummary(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<ApiResponse<{ summary: AiMeetingSummary }>>(
    `${meetingBasePath(workspaceId, projectId, meetingId)}/summary`,
  );
}

export function getMeetingSummaries(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  query: MeetingSummariesQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: AiMeetingSummary[];
      meta: { total: number; page: number; limit: number };
    }>
  >(
    `${meetingBasePath(
      workspaceId,
      projectId,
      meetingId,
    )}/summaries${buildMeetingSummariesSearch(query)}`,
  );
}

export function getMeetingSummaryDetail(
  workspaceId: string,
  projectId: string,
  summaryId: string,
) {
  return apiRequest<ApiResponse<{ summary: AiMeetingSummary }>>(
    `${aiBasePath(workspaceId, projectId)}/meeting-summaries/${summaryId}`,
  );
}

function meetingSummaryActionItemsPath(
  workspaceId: string,
  projectId: string,
  summaryId: string,
) {
  return `${aiBasePath(
    workspaceId,
    projectId,
  )}/meeting-summaries/${summaryId}/action-items`;
}

export function getMeetingActionItems(
  workspaceId: string,
  projectId: string,
  summaryId: string,
) {
  return apiRequest<
    ApiResponse<{ canReview: boolean; items: ReviewedMeetingActionItem[] }>
  >(meetingSummaryActionItemsPath(workspaceId, projectId, summaryId));
}

export function approveMeetingActionItem(
  workspaceId: string,
  projectId: string,
  summaryId: string,
  actionItemIndex: number,
  payload: ApproveMeetingActionItemPayload = {},
) {
  return apiRequest<
    ApiResponse<{
      actionItem: ReviewedMeetingActionItem;
      task: { id: string; taskCode: string; title: string };
    }>
  >(
    `${meetingSummaryActionItemsPath(
      workspaceId,
      projectId,
      summaryId,
    )}/${actionItemIndex}/approve`,
    { method: "POST", body: payload },
  );
}

export function rejectMeetingActionItem(
  workspaceId: string,
  projectId: string,
  summaryId: string,
  actionItemIndex: number,
  reason?: string,
) {
  return apiRequest<ApiResponse<{ actionItem: ReviewedMeetingActionItem }>>(
    `${meetingSummaryActionItemsPath(
      workspaceId,
      projectId,
      summaryId,
    )}/${actionItemIndex}/reject`,
    { method: "POST", body: reason ? { reason } : {} },
  );
}
