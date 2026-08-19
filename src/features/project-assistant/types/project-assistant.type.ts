export type SprintRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskSeverity = "INFO" | "WARNING" | "DANGER";

export type AssistantSource = {
  type: "PROJECT" | "SPRINT" | "TASK" | "DAILY_UPDATE";
  id: string;
  label: string;
  detail: string;
};

export type SprintRiskSignal = {
  code: string;
  severity: RiskSeverity;
  title: string;
  detail: string;
  taskIds: string[];
};

export type SprintRiskAssessment = {
  sprint: {
    id: string;
    name: string;
    goal: string | null;
    status: string;
    startDate: string;
    endDate: string;
  };
  score: number;
  level: SprintRiskLevel;
  levelLabel: string;
  summary: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    completionRate: number;
    overdueTasks: number;
    unassignedTasks: number;
    staleTasks: number;
    blockedMembers: number;
    remainingDays: number;
    elapsedPercent: number;
    expectedProgress: number;
    workloadHoursRemaining: number;
    storyPointsRemaining: number;
  };
  signals: SprintRiskSignal[];
  recommendations: string[];
  generatedAt: string;
};

export type ProjectAssistantAnswer = {
  answer: string;
  sources: AssistantSource[];
  suggestedQuestions: string[];
  sprintRisk?: Pick<SprintRiskAssessment, "score" | "level" | "levelLabel">;
  scope: {
    sprintId: string | null;
    sprintName: string | null;
  };
  actionDraft?: ProjectAssistantActionDraft;
  state?: "GLOBAL" | "NEED_WORKSPACE" | "NEED_PROJECT" | "NEED_SPRINT" | "READY";
  choices?: Array<{ id: string; label: string; description?: string }>;
};

export type ProjectAssistantActionDraft = {
  type: "CREATE_TASK" | "UPDATE_TASK" | "CHANGE_STATUS" | "ASSIGN_TASK" | "MOVE_TASK";
  requiresConfirmation: true;
  taskId?: string;
  taskLabel?: string;
  payload: {
    title?: string;
    description?: string;
    sprintId?: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
    estimatedHours?: number;
    storyPoints?: number;
    status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    assigneeId?: string | null;
  };
};
