import Link from "next/link";
import { Workspace } from "../types/workspace.type";

type WorkspaceCardProps = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <article className="border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-zinc-950">
            {workspace.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{workspace.slug}</p>
          {workspace.description ? (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-700">
              {workspace.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2 text-xs font-medium">
          <span className="border border-zinc-200 px-2 py-1 text-zinc-700">
            {workspace.role ?? workspace.myRole ?? "MEMBER"}
          </span>
          <span className="border border-zinc-200 px-2 py-1 text-zinc-700">
            {workspace.status}
          </span>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          className="border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800"
          href={`/workspaces/${workspace.id}`}
        >
          Detail
        </Link>
        <Link
          className="border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800"
          href={`/workspaces/${workspace.id}/projects`}
        >
          Projects
        </Link>
        <Link
          className="border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800"
          href={`/workspaces/${workspace.id}/settings`}
        >
          Settings
        </Link>
      </div>
    </article>
  );
}
