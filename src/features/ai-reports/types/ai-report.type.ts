export type AiReportType =
  | "PERSONAL_DAILY_REPORT"
  | "TEAM_DAILY_REPORT"
  | "MEETING_SUMMARY";

export type AiReportStatus = "PENDING" | "COMPLETED" | "FAILED";

/**
 * Trang thai cua phien giao ban, tach khoi `AiReportStatus`.
 *
 * `AiReportStatus` noi ve ket qua goi AI, con type nay noi ve quy trinh:
 * DRAFT -> COLLECTING -> AI_GENERATING -> PENDING_REVIEW -> PUBLISHED, va
 * CANCELLED la nhanh ket thuc som.
 *
 * `APPROVED` duoc giu lai vi du lieu cu con gia tri nay; backend anh xa sang
 * PUBLISHED khi doc, nhung type van chap nhan de khong vo khi doc ban cu.
 */
export type AiReportReviewStatus =
  | "DRAFT"
  | "COLLECTING"
  | "AI_GENERATING"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "CANCELLED"
  | "APPROVED";

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
  duplicateCandidates?: Array<{ id: string; taskCode: string; title: string; status: string; similarity: number }>;
  confidence?: number | null;
  citation?: { speakerName: string | null; text: string; startedAt: string; endedAt: string | null; confidence: number | null } | null;
};

export type ApproveMeetingActionItemPayload = {
  title?: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId?: string;
  sprintId?: string;
  dueDate?: string;
  allowDuplicate?: boolean;
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
  citations?: ReportCitation[];
  claims?: ReportClaim[];
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
  citations?: ReportCitation[];
  claims?: ReportClaim[];
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

export type ReportClaim = { id: string; text: string; kind: "FACT" | "INFERENCE" | "RECOMMENDATION"; category: "PROGRESS" | "BLOCKER" | "RISK" | "DECISION" | "OPEN_QUESTION" | "RECOMMENDATION"; sourceIds: string[] };

export type ReportCitation = { type: "TASK" | "DAILY_UPDATE" | "MEETING" | "HANDOVER"; id: string; label: string; href: string };

export type AiMeetingSummary = {
  claims?: MeetingClaim[];
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

export type MeetingClaim = { id: string; text: string; kind: "FACT" | "INFERENCE" | "RECOMMENDATION"; category: "KEY_POINT" | "DECISION" | "BLOCKER" | "OPEN_QUESTION" | "RECOMMENDATION"; citation: { segmentId: string | null; speakerName: string | null; text: string; startedAt: string; endedAt: string | null; confidence: number | null } | null };

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

/** Muc de xuat den tu danh sach vuong mac hay danh sach de xuat cua AI. */
export type TeamReportActionItemSource = "BLOCKER" | "RECOMMENDATION";

export type TeamReportActionItemStatus =
  | "PENDING"
  | "TASK_CREATED"
  | "HANDOVER_REQUESTED"
  | "DISMISSED";

/**
 * Mot muc trong bao cao giao ban kem ket qua xu ly.
 *
 * `source` + `itemIndex` la khoa xac dinh muc; frontend gui lai dung cap nay khi
 * tao task hoac de nghi ban giao.
 */
export type TeamReportActionItem = {
  itemIndex: number;
  source: TeamReportActionItemSource;
  text: string;
  status: TeamReportActionItemStatus;
  createdTaskId: string | null;
  targetTaskId: string | null;
  suggestedReceiverId: string | null;
  handoverId: string | null;
  note: string | null;
  handledAt: string | null;
};

/**
 * Ket qua doc danh sach de xuat cua mot bao cao giao ban.
 *
 * `canHandle` do backend tra ve theo role: thanh vien thuong doc duoc danh sach
 * nhung khong chot duoc, nen frontend an cac nut thao tac thay vi de nguoi dung
 * bam roi nhan 403.
 */
export type TeamReportActionItemsResult = {
  items: TeamReportActionItem[];
  canHandle: boolean;
};

export type CreateTeamReportTaskPayload = {
  source: TeamReportActionItemSource;
  itemIndex: number;
  title?: string;
  assigneeId?: string;
  sprintId?: string;
  dueDate?: string;
};

export type RequestTeamReportHandoverPayload = {
  source: TeamReportActionItemSource;
  itemIndex: number;
  taskId: string;
  suggestedReceiverId: string;
  note?: string;
};

/**
 * Ban nhap cho form bao cao ca nhan.
 *
 * Ten truong khop dung o trong form de nap thang, khong phai anh xa lai.
 */
export type DailyUpdateDraft = {
  yesterdayWork: string;
  todayPlan: string;
  blockers: string;
  notes: string;
};

export type HandoverDraft = {
  completedWork: string;
  remainingWork: string;
  blockers: string;
  nextSteps: string;
  referenceLinks: string;
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
