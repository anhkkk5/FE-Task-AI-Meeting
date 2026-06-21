import { Project } from "../types/project.type";
import { ProjectCard } from "./ProjectCard";

type ProjectListProps = {
  items: Project[];
};

export function ProjectList({ items }: ProjectListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-zinc-300 bg-white rounded-2xl">
        <p className="text-sm text-zinc-500 font-medium">Chưa có dự án nào được khởi tạo.</p>
      </div>
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
