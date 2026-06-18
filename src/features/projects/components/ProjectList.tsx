import { Project } from "../types/project.type";
import { ProjectCard } from "./ProjectCard";

type ProjectListProps = {
  items: Project[];
};

export function ProjectList({ items }: ProjectListProps) {
  if (items.length === 0) {
    return (
      <p className="border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
        No projects loaded.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
