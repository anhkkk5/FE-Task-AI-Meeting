import { AiReportStatus } from "./ai-report.type";

export type PersonalizedMeetingActionItem = {
  title: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  deadline?: string | null;
  priority?: string | null;
  source?: string | null;
};

export type PersonalizedMeetingSummaryOutput = {
  title: string;
  personalSummary: string;
  relevantDecisions: string[];
  myActionItems: PersonalizedMeetingActionItem[];
  mentions: string[];
  risks: string[];
  nextSteps: string[];
  generatedText: string;
};

export type AiPersonalizedMeetingSummary = {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  meetingId: string;
  userId: string;
  sourceSummaryId: string;
  transcriptId: string | null;
  aiOutput: PersonalizedMeetingSummaryOutput;
  personalSummary: string | null;
  model: string | null;
  status: AiReportStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GeneratePersonalizedMeetingSummaryPayload = {
  forceRegenerate?: boolean;
};

export type PersonalizedMeetingActionItemsQuery = {
  meetingId?: string;
  sprintId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type MyMeetingActionItem = PersonalizedMeetingActionItem & {
  meetingId: string;
  meetingTitle: string | null;
  meetingDate: string | null;
  summaryId: string;
};
