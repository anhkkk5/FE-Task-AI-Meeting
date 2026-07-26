export type AiReportType =
  | "PERSONAL_DAILY_REPORT"
  | "TEAM_DAILY_REPORT"
  | "MEETING_SUMMARY";

export type AiReportStatus = "PENDING" | "COMPLETED" | "FAILED";

/**
 * Trang thai duyet cua con nguoi, tach khoi `AiReportStatus`.
 *
 * `AiReportStatus` noi ve ket qua goi AI, con type nay noi ve quy trinh: AI sinh
 * ban nhap, nguoi quan ly xem roi moi duyet thanh bao cao chinh thuc.
 */
export type AiReportReviewStatus = "DRAFT" | "APPROVED";

/** So lieu dinh luong duoc backend tinh san cho the thong ke. */
export type TeamReportMetrics = {
  doneTasks: number;
  totalTasks: number;
  inProgressTasks: number;
  blockerCount: number;
  progressPercent: number;
  memberCount: number;
};

/** Nguon du lieu nguoi dung cho phep AI su dung khi tao bao cao. */
export type TeamReportDataSources = {
  tasks: boolean;
  dailyUpdates: boolean;
  meetingTranscripts: boolean;
  previousReport: boolean;
};

/** Ket qua lan chay gan nhat cua lich tu dong tao bao cao giao ban. */
export type AutomationLastRun = {
  reportDate: string;
  projects: number;
  generated: number;
  skipped: number;
  failed: number;
  finishedAt: string;
};

export type ReportAutomationStatus = {
  enabled: boolean;
  cron: string;
  timeZone: string;
  includeTeam: boolean;
  nextRunAt: string | null;
  lastRun: AutomationLastRun | null;
};

export type PersonalDailyReportOutput = {
  title: string;
  summary: string;
  yesterdaySummary?: string;
  todayPlanSummary?: string;
  completedTasks?: string[];
  inProgressTasks?: string[];
  blockers?: string[];
  risks?: string[];
  handoverSummary?: string;
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
  handoverSummary?: string;
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

export type MeetingActionItemReviewStatus =
  | "PENDING"
  | "TASK_CREATED"
  | "REJECTED";

export type ReviewedMeetingActionItem = MeetingSummaryActionItem & {
  index: number;
  aiStatus?: string | null;
  reviewStatus: MeetingActionItemReviewStatus;
  createdTaskId?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
};

export type ApproveMeetingActionItemPayload = {
  title?: string;
  assigneeId?: string;
  sprintId?: string;
  dueDate?: string;
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
  reviewStatus: AiReportReviewStatus;
  metrics: TeamReportMetrics | null;
  dataSources: TeamReportDataSources | null;
  extraInstruction: string | null;
  editedBy: string | null;
  editedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
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
  dataSources?: Partial<TeamReportDataSources>;
  extraInstruction?: string;
};

/**
 * Cac muc nguoi duyet duoc sua tay.
 *
 * Khong co `metrics`: so lieu phai bam theo du lieu that trong he thong, cho
 * sua tay thi bao cao mat gia tri doi chieu.
 */
export type UpdateTeamReportPayload = {
  summary?: string;
  teamProgress?: string;
  completedWork?: string[];
  todayFocus?: string[];
  blockers?: string[];
  risks?: string[];
  recommendations?: string[];
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
