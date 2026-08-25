export type DailyMood = "GOOD" | "NORMAL" | "BLOCKED" | "TIRED";
export type DailyUpdateSubmissionStatus = "PENDING_REVIEW" | "SUBMITTED" | "MISSED";

export type DailyUpdateUserSummary = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
};

export type DailyUpdateSprintSummary = {
  id: string;
  name: string;
  status: string;
};

export type DailyUpdate = {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  userId: string;
  user: DailyUpdateUserSummary | null;
  sprint: DailyUpdateSprintSummary | null;
  updateDate: string;
  yesterdayWork: string;
  todayPlan: string;
  blockers: string | null;
  notes: string | null;
  mood: DailyMood | null;
  submissionStatus: DailyUpdateSubmissionStatus;
  generatedByAi: boolean;
  submittedAt: string | null;
  /** Nguoi duoc nho ho tro trong ngay, null neu khong can ai. */
  needHelpFromId: string | null;
  needHelpFrom: DailyUpdateUserSummary | null;
  createdAt: string;
  updatedAt?: string;
};

export type DailyUpdateQuery = {
  date?: string;
  fromDate?: string;
  toDate?: string;
  sprintId?: string;
  memberId?: string;
  page?: number;
  limit?: number;
};

export type CreateDailyUpdatePayload = {
  sprintId?: string | null;
  updateDate: string;
  yesterdayWork: string;
  todayPlan: string;
  blockers?: string;
  notes?: string;
  mood?: DailyMood;
  needHelpFromId?: string | null;
};

export type UpdateDailyUpdatePayload = {
  sprintId?: string | null;
  yesterdayWork?: string;
  todayPlan?: string;
  blockers?: string | null;
  notes?: string | null;
  mood?: DailyMood | null;
  needHelpFromId?: string | null;
};
