"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getLatestTeamDailyReport } from "@/features/ai-reports/api/ai-reports.api";
import { AiTeamReport } from "@/features/ai-reports/types/ai-report.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getHandovers } from "@/features/shift-handovers/api/shift-handovers.api";
import { HandoverStatus, ShiftHandover } from "@/features/shift-handovers/types/shift-handover.type";
import { useAuth } from "@/hooks/useAuth";

const statusLabels: Record<HandoverStatus, string> = {
  DRAFT: "Chưa gửi",
  PENDING: "Chờ phản hồi",
  CHANGES_REQUESTED: "Yêu cầu bổ sung",
  ACKNOWLEDGED: "Đã tiếp nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
};

export default function MyHandoverReportPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<AiTeamReport | null>(null);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getProjectDetail(params.workspaceId, params.projectId),
      getHandovers(params.workspaceId, params.projectId, {
        memberId: user.id,
        page: 1,
        limit: 100,
      }),
      getLatestTeamDailyReport(params.workspaceId, params.projectId).catch(
        () => null,
      ),
    ])
      .then(([projectRes, handoverRes, reportRes]) => {
        setProject(projectRes.data.project);
        setHandovers(handoverRes.data.items);
        setReport(reportRes?.data.report ?? null);
      })
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : "Không tải được báo cáo."),
      )
      .finally(() => setLoading(false));
  }, [params.projectId, params.workspaceId, user]);

  const personalSummary = useMemo(
    () =>
      report?.aiOutput.memberSummaries?.find(
        (member) => member.userId === user?.id,
      ) ?? null,
    [report, user?.id],
  );
  const sent = handovers.filter((item) => item.senderId === user?.id);
  const received = handovers.filter((item) => item.receiverId === user?.id);
  const accepted = handovers.filter((item) => item.status === "ACKNOWLEDGED").length;
  const waiting = handovers.filter((item) =>
    ["DRAFT", "PENDING", "CHANGES_REQUESTED"].includes(item.status),
  ).length;

  if (authLoading) return null;

  return (
    <AppShell projectId={params.projectId} title={project?.name} workspaceId={params.workspaceId}>
      <div className="mx-auto max-w-6xl space-y-5 pb-12">
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <Link className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/shift-handovers`}>
            Bàn giao công việc
          </Link>
          <span className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">Giao ban của tôi</span>
          <Link className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/ai-reports/team`}>
            Báo cáo giao ban team
          </Link>
        </nav>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Báo cáo bàn giao cá nhân</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Giao ban của tôi</h1>
          <p className="mt-2 text-sm text-slate-500">Tổng hợp các công việc bạn đã giao, đã nhận và trạng thái phản hồi của từng lượt bàn giao.</p>
        </header>

        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Đang tổng hợp...</div> : null}
        {message ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div> : null}

        {!loading ? (
          <>
            <section className="grid gap-3 sm:grid-cols-4">
              {[
                ["Tôi đã giao", sent.length],
                ["Tôi được nhận", received.length],
                ["Đã tiếp nhận", accepted],
                ["Chờ xử lý", waiting],
              ].map(([label, value]) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={label}>
                  <p className="text-xs font-bold text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
              <h2 className="text-sm font-bold text-brand-900">AI tổng hợp cho bạn</h2>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {personalSummary?.summary ?? "Chưa có báo cáo AI đã phát hành chứa nội dung bàn giao của bạn."}
              </p>
              {personalSummary?.blockers?.length ? (
                <p className="mt-3 text-sm font-semibold text-amber-800">Vướng mắc: {personalSummary.blockers.join("; ")}</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-950">Chi tiết bàn giao liên quan đến tôi</h2>
              <div className="mt-4 grid gap-3">
                {handovers.length ? handovers.map((item) => (
                  <article className="rounded-xl border border-slate-200 p-4" key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{item.task?.taskCode} - {item.task?.title ?? item.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.sender?.fullName ?? "Người giao"} → {item.receiver?.fullName ?? "Người nhận"}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{statusLabels[item.status]}</span>
                    </div>
                    {item.blockers ? <p className="mt-3 text-sm text-amber-800">Vướng mắc: {item.blockers}</p> : null}
                    {item.rejectionReason ? <p className="mt-2 text-sm text-red-700">Lý do từ chối: {item.rejectionReason}</p> : null}
                  </article>
                )) : <p className="py-8 text-center text-sm text-slate-400">Bạn chưa tham gia bàn giao công việc nào.</p>}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
