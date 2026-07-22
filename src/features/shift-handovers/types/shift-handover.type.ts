export type HandoverStatus =
  | "DRAFT"
  | "PENDING"
  | "CHANGES_REQUESTED"
  | "ACKNOWLEDGED"
  | "REJECTED"
  | "CANCELLED";

export type HandoverUser = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export type HandoverTask = {
  id: string;
  taskCode: string;
  title: string;
  status: string;
  assigneeId: string | null;
  assignee: HandoverUser | null;
};

export type ShiftHandover = {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  task: HandoverTask | null;
  senderId: string;
  receiverId: string;
  sender: HandoverUser | null;
  receiver: HandoverUser | null;
  title: string;
  completedWork: string;
  remainingWork: string;
  blockers: string | null;
  nextSteps: string | null;
  referenceLinks: string | null;
  dueAt: string | null;
  status: HandoverStatus;
  changeRequest: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateHandoverPayload = {
  taskId: string;
  receiverId: string;
  completedWork: string;
  remainingWork: string;
  blockers?: string;
  nextSteps?: string;
  referenceLinks?: string;
  dueAt?: string | null;
};

export type UpdateHandoverPayload = Partial<
  Omit<CreateHandoverPayload, "taskId">
>;
