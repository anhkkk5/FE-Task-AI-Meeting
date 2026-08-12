import { expect, test } from "@playwright/test";
import { apiLogin, authenticatedRequest, credentials } from "./support/api";

test.skip(!credentials.userEmail || !credentials.userPassword || !credentials.workspaceId, "Thiếu tài khoản user hoặc E2E_WORKSPACE_ID");

test("tạo Project → Sprint → Task và hiển thị trên Backlog/Board", async ({ request, page }) => {
  const { tokens } = await apiLogin(request, credentials.userEmail, credentials.userPassword);
  const suffix = Date.now().toString().slice(-7);
  const projectResponse = await authenticatedRequest(request, tokens.accessToken, "post", `/workspaces/${credentials.workspaceId}/projects`, { name: `E2E Project ${suffix}`, description: "Playwright lifecycle" });
  const project = projectResponse.data.project;
  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const sprintResponse = await authenticatedRequest(request, tokens.accessToken, "post", `/workspaces/${credentials.workspaceId}/projects/${project.id}/sprints`, { name: `E2E Sprint ${suffix}`, goal: "Verify board", startDate, endDate });
  const sprint = sprintResponse.data.sprint;
  const taskResponse = await authenticatedRequest(request, tokens.accessToken, "post", `/workspaces/${credentials.workspaceId}/projects/${project.id}/tasks`, { title: `E2E Task ${suffix}`, sprintId: sprint.id, priority: "HIGH", taskType: "TASK" });
  const task = taskResponse.data.task;
  await authenticatedRequest(request, tokens.accessToken, "patch", `/workspaces/${credentials.workspaceId}/projects/${project.id}/tasks/${task.id}/status`, { status: "TODO" });

  await page.addInitScript((token) => localStorage.setItem("accessToken", token), tokens.accessToken);
  await page.goto(`/workspaces/${credentials.workspaceId}/projects/${project.id}/sprints`);
  await expect(page.getByText(task.title, { exact: false }).first()).toBeVisible();
  await page.goto(`/workspaces/${credentials.workspaceId}/projects/${project.id}/sprints/${sprint.id}/board`);
  await expect(page.getByText(task.title, { exact: false }).first()).toBeVisible();
});
