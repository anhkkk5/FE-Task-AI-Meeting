import { Task } from "@/features/tasks/types/task.type";

/**
 * Task kem thong tin project/workspace.
 * Backend tra task theo pham vi 1 project nen khong co san cac truong nay,
 * frontend gan them de trang "Viec cua toi" hien duoc nguon goc cua task
 * va dieu huong dung URL long nhau.
 */
export type MyWorkTask = Task & {
  workspaceId: string;
  workspaceName: string;
  projectName: string;
  projectKeyCode: string;
};

export type MyWorkProjectOption = {
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
  projectKeyCode: string;
};

export type MyWorkData = {
  tasks: MyWorkTask[];
  projects: MyWorkProjectOption[];
  /** So project khong tai duoc task, dung de canh bao so lieu chua day du. */
  failedProjects: number;
};
