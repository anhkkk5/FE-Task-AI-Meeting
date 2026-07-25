export type WorkspacesOverviewSummary = {
  workspaces: number;
  projects: number;
  members: number;
  meetings: number;
  tasks: number;
};

export type WorkspaceStatItem = {
  workspaceId: string;
  projectCount: number;
  memberCount: number;
  taskCount: number;
  meetingCount: number;
  updatedAt: string | null;
};

export type WorkspacesOverview = {
  summary: WorkspacesOverviewSummary;
  workspaces: WorkspaceStatItem[];
};

export type DashboardSummary = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  doneTasks: number;
  totalMembers: number;
  upcomingMeetings: number;
  completionRate: number;
};

export type TaskStatusBreakdown = {
  status: string;
  total: number;
};

export type DashboardSprint = {
  id: string;
  name: string;
  projectId: string;
  projectName: string | null;
  startDate: string;
  endDate: string;
  totalTasks: number;
  doneTasks: number;
  progress: number;
};

export type ProductivityPoint = {
  date: string;
  completed: number;
};

export type UpcomingTask = {
  id: string;
  taskCode: string;
  title: string;
  status: string;
  dueDate: string | null;
  projectId: string;
  projectName: string | null;
  assigneeName: string | null;
};

export type DashboardMember = {
  id: string;
  userId: string;
  role: string;
  fullName: string;
  avatarUrl: string | null;
};

export type WorkspaceDashboard = {
  summary: DashboardSummary;
  taskStatusBreakdown: TaskStatusBreakdown[];
  sprint: DashboardSprint | null;
  productivity: ProductivityPoint[];
  upcomingTasks: UpcomingTask[];
  members: DashboardMember[];
};
