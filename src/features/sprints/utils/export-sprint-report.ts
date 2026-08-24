import { Sprint } from "../types/sprint.type";
import { Task } from "@/features/tasks/types/task.type";
import { formatDate } from "@/lib/utils/relative-time";

/**
 * Xuất danh sách Task ra file Excel/CSV (UTF-8 BOM chuẩn tiếng Việt)
 */
export function exportTasksToExcel(
  tasks: Task[],
  filename: string = "Danh_sach_cong_viec.csv",
) {
  if (tasks.length === 0) {
    showAppNotice({ title: "Chưa có dữ liệu", description: "Không có công việc nào để xuất file.", tone: "warning" });
    return;
  }

  // Define headers
  const headers = [
    "Mã Task",
    "Tiêu đề",
    "Sprint",
    "Trạng thái",
    "Người thực hiện",
    "Hạn chót",
    "Ngày tạo",
  ];

  // Map rows
  const rows = tasks.map((t) => [
    t.taskCode || "",
    `"${(t.title || "").replace(/"/g, '""')}"`,
    `"${(t.sprint?.name || "Backlog").replace(/"/g, '""')}"`,
    t.status || "",
    `"${(t.assignee?.fullName || "Chưa phân công").replace(/"/g, '""')}"`,
    t.dueDate ? formatDate(t.dueDate) : "-",
    formatDate(t.createdAt),
  ]);

  // Build CSV string with UTF-8 BOM prefix
  const csvContent =
    "\uFEFF" +
    headers.join(",") +
    "\n" +
    rows.map((e) => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Xuất Báo cáo Sprint & Tiến độ ra định dạng PDF chuẩn in ấn
 */
export function exportSprintReportToPDF(
  sprint: Sprint | null,
  tasks: Task[],
  projectName: string = "Dự án",
  workspaceName: string = "Workspace",
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showAppNotice({ title: "Không thể mở báo cáo", description: "Vui lòng cho phép cửa sổ bật lên để tải file PDF.", tone: "warning" });
    return;
  }

  const completedCount = tasks.filter((t) => t.status === "DONE").length;
  const totalCount = tasks.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo cáo Sprint - ${projectName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 30px;
          color: #0f172a;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .brand {
          font-size: 20px;
          font-weight: 800;
          color: #2563eb;
        }
        .meta {
          font-size: 12px;
          color: #64748b;
        }
        .title-box {
          margin-bottom: 20px;
        }
        .title {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
        }
        .subtitle {
          font-size: 13px;
          color: #475569;
          margin-top: 4px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        .stat-card {
          border: 1px solid #e2e8f0;
          padding: 12px;
          border-radius: 10px;
          background: #f8fafc;
        }
        .stat-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
        }
        .stat-val {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          text-align: left;
        }
        th {
          background: #f1f5f9;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          font-size: 10px;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
        }
        .badge-done { background: #dcfce7; color: #15803d; }
        .badge-progress { background: #e0e7ff; color: #4338ca; }
        .badge-[#f1f2f4] { background: #f1f5f9; color: #475569; }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">✨ AgileFlow AI</div>
        <div class="meta">
          Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}<br>
          Không gian: ${workspaceName}
        </div>
      </div>

      <div class="title-box">
        <h1 class="title">Báo Cáo Tiến Độ ${sprint ? sprint.name : "Dự án"}</h1>
        <div class="subtitle">Dự án: <strong>${projectName}</strong> ${sprint ? `· Thời gian: ${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}` : ""}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Tổng số task</div>
          <div class="stat-val">${totalCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Đã hoàn thành</div>
          <div class="stat-val" style="color: #15803d;">${completedCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Công việc còn lại</div>
          <div class="stat-val" style="color: #2563eb;">${totalCount - completedCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tiến độ hoàn thành</div>
          <div class="stat-val" style="color: #7c3aed;">${progressPct}%</div>
        </div>
      </div>

      <h3>Danh sách Công việc</h3>
      <table>
        <thead>
          <tr>
            <th>Mã Task</th>
            <th>Tiêu đề Công việc</th>
            <th>Trạng thái</th>
            <th>Người thực hiện</th>
            <th>Hạn chót</th>
          </tr>
        </thead>
        <tbody>
          ${tasks
            .map(
              (t) => `
            <tr>
              <td><strong>${t.taskCode || "-"}</strong></td>
              <td>${t.title}</td>
              <td>
                <span class="badge ${
                  t.status === "DONE"
                    ? "badge-done"
                    : t.status === "IN_PROGRESS"
                    ? "badge-progress"
                    : "badge-default"
                }">${t.status}</span>
              </td>
              <td>${t.assignee?.fullName || "Chưa phân công"}</td>
              <td>${t.dueDate ? formatDate(t.dueDate) : "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
import { showAppNotice } from "@/components/feedback/AppDialogProvider";
