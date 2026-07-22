"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  commitTaskImport,
  downloadTaskImportTemplate,
  previewTaskImport,
} from "../api/tasks.api";
import {
  TaskImportItem,
  TaskImportPreviewRow,
  TaskImportPreviewSummary,
  TaskStatus,
} from "../types/task.type";

type TaskImportPanelProps = {
  workspaceId: string;
  projectId: string;
  onClose: () => void;
  onImported: (createdCount: number) => void | Promise<void>;
};

const statusLabels: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  REVIEW: "Review",
  DONE: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getFileLabel(file: File | null) {
  if (!file) return "Chưa chọn file";
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  return `${file.name} · ${sizeKb}KB`;
}

export function TaskImportPanel({
  workspaceId,
  projectId,
  onClose,
  onImported,
}: TaskImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<TaskImportPreviewRow[]>([]);
  const [summary, setSummary] = useState<TaskImportPreviewSummary | null>(null);
  const [message, setMessage] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const validItems = useMemo<TaskImportItem[]>(
    () => rows.filter((row) => row.valid).map((row) => row.data),
    [rows],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setRows([]);
    setSummary(null);
    setMessage("");
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    setMessage("");

    try {
      const blob = await downloadTaskImportTemplate(workspaceId, projectId);
      downloadBlob(blob, "backlog-import-template.xlsx");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không tải được file mẫu.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setMessage("Bạn cần chọn file Excel trước khi preview.");
      return;
    }

    setIsPreviewing(true);
    setMessage("");

    try {
      const response = await previewTaskImport(workspaceId, projectId, file);
      setRows(response.data.items);
      setSummary(response.data.summary);
    } catch (error) {
      setRows([]);
      setSummary(null);
      setMessage(error instanceof Error ? error.message : "Preview thất bại.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (validItems.length === 0) {
      setMessage("Không có dòng hợp lệ để import.");
      return;
    }

    setIsImporting(true);
    setMessage("");

    try {
      const response = await commitTaskImport(workspaceId, projectId, validItems);
      await onImported(response.data.summary.created);
      setRows([]);
      setSummary(null);
      setFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import thất bại.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="rounded border border-[#dfe1e6] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#dfe1e6] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
            Import backlog
          </p>
          <h2 className="text-lg font-semibold text-[#172b4d]">
            Nhập task bằng Excel
          </h2>
          <p className="mt-1 text-sm text-[#6b778c]">
            Tải file mẫu, điền task, preview lỗi từng dòng rồi mới tạo task.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f7f8f9] disabled:opacity-60"
            disabled={isDownloading}
            onClick={() => void handleDownloadTemplate()}
            type="button"
          >
            {isDownloading ? "Đang tải..." : "Tải file mẫu"}
          </button>
          <button
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f7f8f9]"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded border border-dashed border-[#b3b9c4] bg-[#f7f8f9] px-3 text-sm text-[#44546f] hover:bg-[#f1f2f4]">
            <span className="truncate">{getFileLabel(file)}</span>
            <span className="shrink-0 rounded border border-[#dfe1e6] bg-white px-2 py-1 text-xs font-semibold text-[#44546f]">
              Chọn Excel
            </span>
            <input
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              type="file"
            />
          </label>

          <button
            className="h-11 rounded bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] disabled:cursor-not-allowed disabled:bg-[#b3b9c4]"
            disabled={!file || isPreviewing}
            onClick={() => void handlePreview()}
            type="button"
          >
            {isPreviewing ? "Đang kiểm tra..." : "Preview dữ liệu"}
          </button>

          <button
            className="h-11 rounded bg-[#00875a] px-4 text-sm font-semibold text-white hover:bg-[#216e4e] disabled:cursor-not-allowed disabled:bg-[#b3b9c4]"
            disabled={validItems.length === 0 || isImporting}
            onClick={() => void handleImport()}
            type="button"
          >
            {isImporting ? "Đang import..." : `Import ${validItems.length} dòng`}
          </button>
        </div>

        {message ? (
          <div className="rounded border border-[#f5cd47] bg-[#fff7d6] px-3 py-2 text-sm font-medium text-[#7f5f01]">
            {message}
          </div>
        ) : null}

        {summary ? (
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded bg-[#f1f2f4] px-2 py-1 text-[#44546f]">
              Tổng: {summary.totalRows}
            </span>
            <span className="rounded bg-[#dcfff1] px-2 py-1 text-[#216e4e]">
              Hợp lệ: {summary.validRows}
            </span>
            <span className="rounded bg-[#fff4f2] px-2 py-1 text-[#ae2a19]">
              Có lỗi: {summary.invalidRows}
            </span>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded border border-[#dfe1e6]">
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead className="bg-[#f7f8f9] text-left text-xs font-semibold uppercase tracking-wide text-[#6b778c]">
                <tr>
                  <th className="w-16 px-3 py-2">Dòng</th>
                  <th className="px-3 py-2">Tiêu đề</th>
                  <th className="w-44 px-3 py-2">Sprint</th>
                  <th className="w-52 px-3 py-2">Người nhận</th>
                  <th className="w-32 px-3 py-2">Trạng thái</th>
                  <th className="w-72 px-3 py-2">Kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className="border-t border-[#dfe1e6] align-top hover:bg-[#f7f8f9]"
                    key={row.rowNumber}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-[#6b778c]">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2 font-medium text-[#172b4d]">
                      {row.data.title || "-"}
                    </td>
                    <td className="px-3 py-2 text-[#44546f]">
                      {row.data.sprintName || row.data.sprintId || "Backlog"}
                    </td>
                    <td className="px-3 py-2 text-[#44546f]">
                      {row.data.assigneeEmail || row.data.assigneeId || "-"}
                    </td>
                    <td className="px-3 py-2 text-[#44546f]">
                      {row.data.status ? statusLabels[row.data.status] : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <span className="rounded bg-[#dcfff1] px-2 py-1 text-xs font-semibold text-[#216e4e]">
                          Hợp lệ
                        </span>
                      ) : (
                        <ul className="space-y-1 text-xs font-medium text-[#ae2a19]">
                          {row.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#dfe1e6] bg-[#fafbfc] px-4 py-6 text-center text-sm text-[#6b778c]">
            Chưa có dữ liệu preview. Hãy chọn file Excel rồi bấm Preview dữ liệu.
          </div>
        )}
      </div>
    </section>
  );
}
