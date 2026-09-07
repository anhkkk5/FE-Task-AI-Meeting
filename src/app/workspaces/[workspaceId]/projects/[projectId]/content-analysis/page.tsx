"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MeetingFileAnalyzer } from "@/features/meetings/components/MeetingFileAnalyzer";
import { ArrowLeft, FileSearch } from "lucide-react";

export default function ContentAnalysisPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  return (
    <AppShell workspaceId={params.workspaceId} projectId={params.projectId} title="Phân tích nội dung">
      <div className="mx-auto max-w-6xl space-y-5 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><FileSearch className="h-7 w-7" /></span><div><h1 className="text-2xl font-black text-slate-900">Phân tích file & video</h1><p className="mt-1 text-sm text-slate-500">Không gian phân tích độc lập với dữ liệu cuộc họp.</p></div></div>
          <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50" href={`/workspaces/${params.workspaceId}/projects/${params.projectId}`}><ArrowLeft className="h-4 w-4" /> Về dự án</Link>
        </div>
        <MeetingFileAnalyzer workspaceId={params.workspaceId} projectId={params.projectId} />
      </div>
    </AppShell>
  );
}
