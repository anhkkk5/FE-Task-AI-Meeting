"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Briefcase, CheckCircle2, Crown, FolderKanban, ListChecks, Save, Users } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  AdminWorkspaceDetail,
  getAdminWorkspaceDetail,
  updateAdminWorkspace,
} from "@/features/admin/api/admin.api";
import { useAuth } from "@/hooks/useAuth";

const roleLabels: Record<string, string> = {
  OWNER: "Chủ Workspace",
  PROJECT_MANAGER: "Quản lý dự án",
  SCRUM_MASTER: "Scrum Master",
  MEMBER: "Thành viên",
  VIEWER: "Chỉ xem",
};

export default function AdminWorkspaceDetailPage() {
  const { user } = useAuth(true);
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [detail, setDetail] = useState<AdminWorkspaceDetail | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminWorkspaceDetail(workspaceId);
      setDetail(response.data);
      setName(response.data.workspace.name);
      setDescription(response.data.workspace.description ?? "");
      setPlan(response.data.workspace.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải workspace.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (user?.isSystemAdmin) void load();
  }, [user, load]);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await updateAdminWorkspace(workspaceId, { name: name.trim(), description, plan });
      setDetail(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật workspace.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Chi tiết Workspace">
      <div className="space-y-6">
        <Link href="/admin/workspaces" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
        {loading ? <div className="py-16 text-center text-sm text-slate-500">Đang tải chi tiết Workspace...</div> : null}

        {detail ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900">{detail.workspace.name}</h1>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${detail.workspace.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {detail.workspace.status === "ACTIVE" ? "Đang hoạt động" : "Đã lưu trữ"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">@{detail.workspace.slug}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <Crown className="h-4 w-4" />
                    <strong>Chủ Workspace:</strong> {detail.workspace.owner?.full_name ?? "Chưa xác định"} ({detail.workspace.owner?.email ?? "—"})
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Ngày tạo: {new Date(detail.workspace.createdAt).toLocaleDateString("vi-VN")}</p>
                  <p className="mt-1">Admin Console là chế độ giám sát toàn hệ thống.</p>
                </div>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [Users, "Thành viên", detail.totals.memberCount],
                [FolderKanban, "Dự án", detail.totals.projectCount],
                [Briefcase, "Sprint", detail.totals.sprintCount],
                [ListChecks, "Công việc", detail.totals.taskCount],
              ].map(([Icon, label, value]) => {
                const MetricIcon = Icon as typeof Users;
                return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5"><MetricIcon className="h-5 w-5 text-blue-600" /><p className="mt-3 text-xs font-bold uppercase text-slate-500">{String(label)}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{String(value)}</p></div>;
              })}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900">Chỉnh sửa Workspace</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <label className="text-xs font-bold text-slate-600">Tên<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" /></label>
                <label className="text-xs font-bold text-slate-600 lg:col-span-2">Mô tả<input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" /></label>
                <label className="text-xs font-bold text-slate-600">Gói dịch vụ<select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>FREE</option><option>PRO</option><option>ENTERPRISE</option></select></label>
              </div>
              <button onClick={() => void save()} disabled={saving || !name.trim()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4" /> Lưu thay đổi</button>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5"><h2 className="font-extrabold text-slate-900">Thành viên và vai trò</h2><p className="mt-1 text-xs text-slate-500">OWNER quản lý Workspace và lời mời; Project Manager/Scrum Master quản lý dự án và Sprint.</p></div>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-4">Thành viên</th><th className="p-4">Vai trò</th><th className="p-4">Trạng thái</th><th className="p-4">Ngày tham gia</th></tr></thead><tbody className="divide-y divide-slate-100">{detail.members.map((member) => <tr key={member.id}><td className="p-4"><strong className="text-slate-900">{member.fullName}</strong><p className="text-xs text-slate-500">{member.email}</p></td><td className="p-4 font-semibold text-blue-700">{roleLabels[member.role] ?? member.role}</td><td className="p-4"><span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" />{member.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}</span></td><td className="p-4 text-slate-500">{new Date(member.joinedAt).toLocaleDateString("vi-VN")}</td></tr>)}</tbody></table></div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5"><h2 className="font-extrabold text-slate-900">Dự án trong Workspace</h2></div>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-4">Dự án</th><th className="p-4">Người tạo</th><th className="p-4">Sprint</th><th className="p-4">Công việc</th><th className="p-4">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">{detail.projects.map((project) => <tr key={project.id}><td className="p-4"><strong>{project.name}</strong><p className="text-xs text-slate-500">{project.keyCode}</p></td><td className="p-4 text-slate-600">{project.creatorName ?? "—"}</td><td className="p-4 font-bold">{project.sprintCount}</td><td className="p-4 font-bold">{project.taskCount}</td><td className="p-4 text-slate-600">{project.status}</td></tr>)}</tbody></table></div>
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
