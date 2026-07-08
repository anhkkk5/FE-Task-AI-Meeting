export type AiReportType =
  | "PERSONAL_DAILY_REPORT"
  | "TEAM_DAILY_REPORT"
  | "MEETING_SUMMARY";

export type AiReportStatus = "PENDING" | "COMPLETED" | "FAILED";

export type PersonalDailyReportOutput = {
  title: string;
  summary: string;
  yesterdaySummary?: string;
  todayPlanSummary?: string;
  completedTasks?: string[];
  inProgressTasks?: string[];
  blockers?: string[];
  risks?: string[];
  recommendations?: string[];
  generatedText: string;
};

export type TeamDailyReportOutput = {
  title: string;
  summary: string;
  teamProgress: string;
  completedWork?: string[];
  todayFocus?: string[];
  blockers?: string[];
  risks?: string[];
  missingDailyUpdates?: string[];
  memberSummaries?: {
    userId: string;
    fullName: string;
    summary: string;
    blockers: string[];
  }[];
  recommendations?: string[];
  generatedText: string;
};

export type MeetingSummaryActionItem = {
  text: string;
  assigneeName?: string | null;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  status?: string | null;
  source?: string | null;
};

export type MeetingSummaryOutput = {
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: MeetingSummaryActionItem[];
  risks: string[];
  openQuestions: string[];
  nextSteps: string[];
  generatedText: string;
};

export type AiPersonalReport = {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  userId: string;
  reportType: AiReportType;
  reportDate: string;
  aiOutput: PersonalDailyReportOutput;
  summary: string | null;
  model: string | null;
  status: AiReportStatus;
  createdBy: string;
  inputData?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AiTeamReport = {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  userId: string | null;
  reportType: "TEAM_DAILY_REPORT";
  reportDate: string;
  aiOutput: TeamDailyReportOutput;
  summary: string | null;
  model: string | null;
  status: AiReportStatus;
  createdBy: string;
  inputData?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AiMeetingSummary = {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  meetingId: string;
  transcriptId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: MeetingSummaryActionItem[];
  risks: string[];
  openQuestions: string[];
  nextSteps: string[];
  aiOutput: MeetingSummaryOutput;
  model: string | null;
  status: AiReportStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GeneratePersonalReportPayload = {
  reportDate: string;
  sprintId?: string;
};

export type GenerateTeamReportPayload = {
  reportDate: string;
  sprintId?: string;
};

export type GenerateMeetingSummaryPayload = {
  forceRegenerate?: boolean;
};

export type AiReportsQuery = {
  fromDate?: string;
  toDate?: string;
  sprintId?: string;
  page?: number;
  limit?: number;
};

export type MeetingSummariesQuery = {
  page?: number;
  limit?: number;
};
