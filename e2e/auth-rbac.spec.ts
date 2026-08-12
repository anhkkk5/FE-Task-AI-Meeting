import { expect, test } from "@playwright/test";
import { credentials, loginInBrowser } from "./support/api";

test.describe("Login và phân quyền", () => {
  test.skip(!credentials.adminEmail || !credentials.adminPassword || !credentials.userEmail || !credentials.userPassword, "Thiếu biến môi trường cho tài khoản admin/user E2E");
  test("admin đăng nhập và được chuyển tới Admin Console", async ({ page }) => {
    await loginInBrowser(page, credentials.adminEmail, credentials.adminPassword);
    await expect(page).toHaveURL(/\/admin(?:\/|$)/);
    await expect(page.getByText(/Tổng quan hệ thống|Admin Console/i).first()).toBeVisible();
  });

  test("user thường đăng nhập và không vào được Admin Console", async ({ page }) => {
    await loginInBrowser(page, credentials.userEmail, credentials.userPassword);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});
