import { expect, test } from "@playwright/test";
import { apiLogin, authenticatedRequest, credentials } from "./support/api";

const projectId = process.env.E2E_AI_PROJECT_ID ?? "";
test.skip(!credentials.userEmail || !credentials.userPassword || !credentials.workspaceId || !projectId, "Cần E2E_AI_PROJECT_ID");

test("Project Assistant tạo bản nháp và chỉ ghi dữ liệu sau xác nhận", async ({ request }) => {
  const { tokens } = await apiLogin(request, credentials.userEmail, credentials.userPassword);
  const answer = await authenticatedRequest(request, tokens.accessToken, "post", `/workspaces/${credentials.workspaceId}/projects/${projectId}/ai/assistant/ask`, { question: `Tạo task E2E Assistant ${Date.now()} với priority HIGH` });
  expect(answer.data.actionDraft?.requiresConfirmation).toBe(true);
  expect(answer.data.actionDraft?.type).toBe("CREATE_TASK");
  expect(answer.data.actionDraft?.payload?.title).toBeTruthy();
});
