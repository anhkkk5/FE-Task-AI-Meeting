import Link from "next/link";
import { Project } from "../types/project.type";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-zinc-950">
            {project.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            {project.keyCode}
          </p>
          {project.description ? (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-700">
              {project.description}
            </p>
          ) : null}
        </div>
        <span className="w-fit shrink-0 border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700">
          {project.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800"
          href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
        >
          Detail
        </Link>
        <Link
          className="border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800"
          href={`/workspaces/${project.workspaceId}/projects/${project.id}/settings`}
        >
          Settings
        </Link>
      </div>
    </article>
  );
}
