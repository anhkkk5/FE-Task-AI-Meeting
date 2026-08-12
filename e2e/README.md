# Playwright E2E

## Chuẩn bị

1. Chạy frontend ở cổng `3000` và backend ở cổng `3001`.
2. Cài browser một lần: `npx playwright install chromium`.
3. Khai báo các biến trong `.env.e2e.example` vào terminal/CI secret. Không commit mật khẩu thật.

Ví dụ PowerShell:

```powershell
$env:E2E_USER_EMAIL="user@example.com"
$env:E2E_USER_PASSWORD="..."
$env:E2E_ADMIN_EMAIL="admin@example.com"
$env:E2E_ADMIN_PASSWORD="..."
$env:E2E_WORKSPACE_ID="workspace-uuid"
npm run test:e2e
```

Hai test AI cần thêm `E2E_AI_PROJECT_ID` và `E2E_MEETING_ID`; meeting phải có transcript. Nếu thiếu fixture, test được đánh dấu skipped thay vì báo pass giả.

Các artifact khi lỗi gồm screenshot, video và trace. Mở báo cáo bằng `npm run test:e2e:report`.
