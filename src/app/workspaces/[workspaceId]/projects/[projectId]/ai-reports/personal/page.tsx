"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RemovedPersonalReportPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/me`);
  }, [params.projectId, params.workspaceId, router]);
  return <div className="flex min-h-screen items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" /></div>;
}
