import { expect, test } from "@playwright/test";
import { apiLogin, authenticatedRequest, credentials } from "./support/api";

const projectId = process.env.E2E_AI_PROJECT_ID ?? "";
const meetingId = process.env.E2E_MEETING_ID ?? "";
test.skip(!credentials.userEmail || !credentials.userPassword || !credentials.workspaceId || !projectId || !meetingId, "Cần E2E_AI_PROJECT_ID và E2E_MEETING_ID đã có transcript");

test("Meeting → transcript → Action Item → Task", async ({ request }) => {
  const { tokens } = await apiLogin(request, credentials.userEmail, credentials.userPassword);
  const transcript = await authenticatedRequest(request, tokens.accessToken, "get", `/workspaces/${credentials.workspaceId}/projects/${projectId}/meetings/${meetingId}/transcript`);
  expect(transcript.data).toBeTruthy();
  const items = await authenticatedRequest(request, tokens.accessToken, "get", `/workspaces/${credentials.workspaceId}/projects/${projectId}/ai/meeting-action-items?meetingId=${meetingId}`);
  expect(Array.isArray(items.data.items)).toBeTruthy();
});
