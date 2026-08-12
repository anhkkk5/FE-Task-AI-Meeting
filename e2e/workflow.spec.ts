import { expect, test } from "@playwright/test";
import { apiLogin, authenticatedRequest, credentials } from "./support/api";

test.skip(!credentials.userEmail || !credentials.userPassword || !credentials.workspaceId, "Thiếu E2E user/workspace");

test("workflow tùy chỉnh trả về trạng thái và transition động", async ({ request }) => {
  const { tokens } = await apiLogin(request, credentials.userEmail, credentials.userPassword);
  const templates = await authenticatedRequest(request, tokens.accessToken, "get", `/workspaces/${credentials.workspaceId}/projects/workflow-templates`);
  expect(Array.isArray(templates.data.items)).toBeTruthy();
  expect(templates.data.items.length).toBeGreaterThan(0);
});
