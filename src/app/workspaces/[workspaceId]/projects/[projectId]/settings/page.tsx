"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  applyWorkflowTemplate,
  archiveProject,
  completeProject,
  createWorkflowTemplate,
  getProjectDetail,
  getWorkflowTemplates,
  updateProject,
  type WorkflowTemplate,
} from "@/features/projects/api/projects.api";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { Project, WorkflowStatusConfig, WorkflowTransitionConfig } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectSettingsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatusConfig[]>([]);
  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransitionConfig[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const loadProject = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await getProjectDetail(
          params.workspaceId,
          params.projectId,
        );
        setProject(response.data.project);
        setWorkflowStatuses(response.data.project.workflowStatuses);
        setWorkflowTransitions(response.data.project.workflowTransitions);
        setSelectedTemplateId(response.data.project.workflowTemplateId ?? "");
        const templates = await getWorkflowTemplates(params.workspaceId);
        setWorkflowTemplates(templates.data.items);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải cấu hình dự án thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [params.projectId, params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadProject();
    }
  }, [user, params.workspaceId, params.projectId, loadProject]);

  async function handleUpdate(payload: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const response = await updateProject(
        params.workspaceId,
        params.projectId,
        {
          name: payload.name,
          description: payload.description,
          startDate: payload.startDate,
          endDate: payload.endDate,
        },
      );
      setProject(response.data.project);
      setMessage("Cập nhật thông tin dự án thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật dự án thất bại.");
    }
  }

  async function handleArchive() {
    if (!confirm("Bạn có chắc chắn muốn lưu trữ dự án này không?")) {
      return;
    }

    try {
      await archiveProject(params.workspaceId, params.projectId);
      router.push(`/workspaces/${params.workspaceId}/projects`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu trữ dự án thất bại.");
    }
  }

  async function saveWorkflow() {
    try {
      const response = await updateProject(params.workspaceId, params.projectId, { workflowStatuses, workflowTransitions });
      setProject(response.data.project);
      setMessage("Đã lưu workflow và áp dụng cho các lần đổi trạng thái tiếp theo.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể lưu workflow."); }
  }

  async function applySelectedTemplate() {
    if (!selectedTemplateId) return;
    try {
      const response = await applyWorkflowTemplate(params.workspaceId, params.projectId, selectedTemplateId);
      setProject(response.data.project);
      setWorkflowStatuses(response.data.project.workflowStatuses);
      setWorkflowTransitions(response.data.project.workflowTransitions);
      setMessage("Đã áp dụng workflow template và đồng bộ trạng thái công việc.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể áp dụng template."); }
  }

  async function saveAsTemplate() {
    const name = prompt("Tên workflow template mới:");
    if (!name?.trim()) return;
    try {
      const response = await createWorkflowTemplate(params.workspaceId, { name: name.trim(), statuses: workflowStatuses, transitions: workflowTransitions });
      const templates = await getWorkflowTemplates(params.workspaceId);
      setWorkflowTemplates(templates.data.items);
      setSelectedTemplateId(response.data.id);
      setMessage("Đã lưu workflow thành template dùng chung.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể lưu template."); }
  }

  function toggleTransition(from: WorkflowStatusConfig["key"], to: WorkflowStatusConfig["key"]) {
    setWorkflowTransitions((items) => items.some((item) => item.from === from && item.to === to) ? items.filter((item) => item.from !== from || item.to !== to) : [...items, { from, to }]);
  }

  async function handleComplete() {
    if (!confirm("Xác nhận đã hoàn thành dự án này?")) {
      return;
    }

    try {
      await completeProject(params.workspaceId, params.projectId);
      router.push(`/workspaces/${params.workspaceId}/projects`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đánh dấu hoàn thành thất bại.");
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell workspaceId={params.workspaceId} projectId={params.projectId} title={project?.name}>
      <div className="max-w-3xl space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Cài đặt Dự án</h1>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Yêu cầu quyền hạn OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER.
            </p>
          </div>
          <button
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            type="button"
            onClick={() => void loadProject()}
            disabled={isLoading}
          >
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : project ? (
          <div className="grid gap-6">
            {/* Update Info Form */}
            <div className="border border-zinc-200/80 bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-zinc-800 mb-4 pb-3 border-b border-zinc-100">Thông tin chung</h2>
              <ProjectForm
                initialDescription={project.description}
                initialEndDate={project.endDate}
                initialName={project.name}
                initialStartDate={project.startDate}
                mode="update"
                submitLabel="Lưu thay đổi"
                onSubmit={handleUpdate}
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-bold uppercase text-blue-700">Template dùng chung</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select className="min-w-56 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs" onChange={(event) => setSelectedTemplateId(event.target.value)} value={selectedTemplateId}>
                    <option value="">Chọn workflow template</option>
                    {workflowTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.is_system ? " (Hệ thống)" : ""}</option>)}
                  </select>
                  <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" disabled={!selectedTemplateId} onClick={() => void applySelectedTemplate()} type="button">Áp dụng template</button>
                  <button className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700" onClick={() => void saveAsTemplate()} type="button">Lưu thành template mới</button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-zinc-800">Workflow của Project</h2><p className="mt-1 text-xs text-zinc-500">Đổi tên, màu, thứ tự và các bước chuyển trạng thái được phép.</p></div><button className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white" onClick={() => void saveWorkflow()} type="button">Lưu workflow</button></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">{[...workflowStatuses].sort((a, b) => a.order - b.order).map((status, index) => <div className="grid grid-cols-[36px_1fr_90px_70px] items-center gap-2 rounded-xl bg-zinc-50 p-3" key={status.key}><span className="text-xs font-black text-zinc-400">{index + 1}</span><input className="h-9 rounded-lg border border-zinc-200 px-2 text-xs font-semibold" onChange={(event) => setWorkflowStatuses((items) => items.map((item) => item.key === status.key ? { ...item, label: event.target.value } : item))} value={status.label} /><input className="h-9 w-full rounded-lg border border-zinc-200" onChange={(event) => setWorkflowStatuses((items) => items.map((item) => item.key === status.key ? { ...item, color: event.target.value } : item))} type="color" value={status.color} /><label className="flex items-center gap-1 text-[10px] font-bold"><input checked={status.enabled} disabled={status.key === "DONE"} onChange={(event) => setWorkflowStatuses((items) => items.map((item) => item.key === status.key ? { ...item, enabled: event.target.checked } : item))} type="checkbox" />Bật</label></div>)}</div>
              <h3 className="mt-6 text-xs font-bold uppercase text-zinc-500">Transition được phép</h3><div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="p-2 text-left">Từ / Đến</th>{workflowStatuses.filter((status) => status.enabled).map((status) => <th className="p-2" key={status.key}>{status.label}</th>)}</tr></thead><tbody>{workflowStatuses.filter((status) => status.enabled).map((from) => <tr className="border-t border-zinc-100" key={from.key}><th className="p-2 text-left">{from.label}</th>{workflowStatuses.filter((status) => status.enabled).map((to) => <td className="p-2 text-center" key={to.key}><input checked={from.key !== to.key && workflowTransitions.some((item) => item.from === from.key && item.to === to.key)} disabled={from.key === to.key} onChange={() => toggleTransition(from.key, to.key)} type="checkbox" /></td>)}</tr>)}</tbody></table></div>
              <div className="mt-5 space-y-2"><h3 className="text-xs font-bold uppercase text-zinc-500">Vai trò theo transition</h3>{workflowTransitions.map((transition, index) => <div className="grid gap-2 rounded-lg bg-zinc-50 p-2 sm:grid-cols-[180px_1fr]" key={`${transition.from}-${transition.to}`}><span className="text-xs font-bold text-zinc-700">{transition.from} → {transition.to}</span><div className="flex flex-wrap gap-2">{(["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER", "MEMBER", "VIEWER"] as const).map((role) => <label className="flex items-center gap-1 text-[10px] font-semibold" key={role}><input checked={!transition.roles?.length || transition.roles.includes(role)} onChange={(event) => setWorkflowTransitions((items) => items.map((item, itemIndex) => { if (itemIndex !== index) return item; const current = item.roles?.length ? item.roles : ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER", "MEMBER", "VIEWER"]; return { ...item, roles: event.target.checked ? [...new Set([...current, role])] : current.filter((value) => value !== role) }; }))} type="checkbox" />{role}</label>)}</div></div>)}</div>
              <div className="mt-6"><h3 className="text-xs font-bold uppercase text-zinc-500">Preview Board</h3><div className="mt-3 flex gap-2 overflow-x-auto">{workflowStatuses.filter((status) => status.enabled && status.key !== "CANCELLED").sort((a, b) => a.order - b.order).map((status) => <div className="min-w-36 rounded-xl border border-zinc-200 bg-zinc-50 p-3" key={status.key}><div className="h-1.5 rounded-full" style={{ backgroundColor: status.color }} /><p className="mt-2 text-xs font-bold text-zinc-700">{status.label}</p><div className="mt-3 h-16 rounded-lg border border-dashed border-zinc-200 bg-white" /></div>)}</div></div>
            </div>

            {/* Actions / Danger Zone Panel */}
            <div className="border border-red-200 bg-white p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-red-900 pb-3 border-b border-red-100">Vùng nguy hiểm & Hành động nhanh</h2>
              <p className="text-xs text-zinc-500">
                Hãy cẩn thận khi thực hiện các hành động này. Dự án đã lưu trữ sẽ không thể thực hiện Sprint mới.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                  type="button"
                  onClick={() => void handleComplete()}
                >
                  Đánh dấu hoàn thành (Complete)
                </button>
                <button
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                  type="button"
                  onClick={() => void handleArchive()}
                >
                  Lưu trữ dự án (Archive)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
            <p className="text-sm text-zinc-500">Không tìm thấy thông tin cấu hình dự án.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
