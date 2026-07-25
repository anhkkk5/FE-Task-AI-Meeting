import { getProjects } from "@/features/projects/api/projects.api";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import {
  MyWorkData,
  MyWorkProjectOption,
  MyWorkTask,
} from "../types/my-work.type";

const TASK_LIMIT_PER_PROJECT = 100;
const PROJECT_LIMIT_PER_WORKSPACE = 100;

/**
 * Backend chua co endpoint "task cua toi" xuyen project: TasksController nam duoi
 * prefix workspaces/:workspaceId/projects/:projectId nen bat buoc phai biet project.
 * Vi vay lop nay tong hop o phia client theo 3 tang: workspace -> project -> task.
 *
 * Dung allSettled o moi tang de mot project loi khong lam trong ca trang,
 * va dem so project that bai de UI canh bao rang so lieu chua day du.
 */
export async function getMyWork(userId: string): Promise<MyWorkData> {
  const workspacesResponse = await getMyWorkspaces("ACTIVE");
  const workspaces = workspacesResponse.data.items;

  const projectResults = await Promise.allSettled(
    workspaces.map(async (workspace) => {
      const response = await getProjects(workspace.id, {
        status: "ACTIVE",
        limit: PROJECT_LIMIT_PER_WORKSPACE,
      });

      return response.data.items.map<MyWorkProjectOption>((project) => ({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        projectId: project.id,
        projectName: project.name,
        projectKeyCode: project.keyCode,
      }));
    }),
  );

  const projects = projectResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  const taskResults = await Promise.allSettled(
    projects.map(async (project) => {
      const response = await getTasks(project.workspaceId, project.projectId, {
        assigneeId: userId,
        limit: TASK_LIMIT_PER_PROJECT,
      });

      return response.data.items.map<MyWorkTask>((task) => ({
        ...task,
        workspaceId: project.workspaceId,
        workspaceName: project.workspaceName,
        projectName: project.projectName,
        projectKeyCode: project.projectKeyCode,
      }));
    }),
  );

  const tasks = taskResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  const failedProjects = taskResults.filter(
    (result) => result.status === "rejected",
  ).length;

  return { tasks, projects, failedProjects };
}
