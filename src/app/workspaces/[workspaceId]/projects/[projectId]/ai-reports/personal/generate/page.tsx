"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RemovedPersonalReportGeneratePage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/me`);
  }, [params.projectId, params.workspaceId, router]);
  return null;
}
