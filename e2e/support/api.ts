import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const apiBase = process.env.E2E_API_URL ?? "http://127.0.0.1:3001/api";
export const credentials = {
  userEmail: process.env.E2E_USER_EMAIL ?? "",
  userPassword: process.env.E2E_USER_PASSWORD ?? "",
  adminEmail: process.env.E2E_ADMIN_EMAIL ?? "",
  adminPassword: process.env.E2E_ADMIN_PASSWORD ?? "",
  workspaceId: process.env.E2E_WORKSPACE_ID ?? "",
};

export async function apiLogin(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${apiBase}/auth/login`, { data: { email, password } });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  if (body.data.mfaRequired) throw new Error(`E2E account ${email} has MFA enabled; use a dedicated non-MFA test account.`);
  return body.data as { user: { id: string; isSystemAdmin?: boolean }; tokens: { accessToken: string } };
}

export async function authenticatedRequest(request: APIRequestContext, token: string, method: "get" | "post" | "patch" | "delete", path: string, data?: unknown) {
  const response = await request[method](`${apiBase}${path}`, { headers: { Authorization: `Bearer ${token}` }, data });
  expect(response.ok(), `${method.toUpperCase()} ${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

export async function loginInBrowser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("name@company.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}
