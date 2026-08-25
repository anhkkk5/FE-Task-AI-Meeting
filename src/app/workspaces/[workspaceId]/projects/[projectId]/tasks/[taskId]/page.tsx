"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TaskDetailRedirectPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    taskId: string;
  }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks?taskId=${params.taskId}`,
    );
  }, [params.projectId, params.taskId, params.workspaceId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
    </div>
  );
}
