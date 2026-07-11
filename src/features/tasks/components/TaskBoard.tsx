import { Task, TaskPriority, TaskStatus } from "../types/task.type";

type TaskBoardProps = {
  items: Task[];
};

const columns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "Cần làm" },
  { status: "IN_PROGRESS", label: "Đang làm" },
  { status: "REVIEW", label: "Review" },
  { status: "DONE", label: "Hoàn thành" },
];

function priorityLabel(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
      return "Cao nhất";
    case "HIGH":
      return "Cao";
    case "MEDIUM":
      return "Vừa";
    case "LOW":
    default:
      return "Thấp";
  }
}

function priorityClass(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
      return "text-[#ae2a19]";
    case "HIGH":
      return "text-[#c25100]";
    case "MEDIUM":
      return "text-[#974f0c]";
    case "LOW":
    default:
      return "text-[#6b778c]";
  }
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
  });
}

export function TaskBoard({ items }: TaskBoardProps) {
  return (
    <div className="grid min-w-[960px] gap-3 overflow-x-auto pb-2 xl:grid-cols-4">
      {columns.map((column) => {
        const columnTasks = items.filter((task) => task.status === column.status);

        return (
          <section
            key={column.status}
            className="flex min-h-[520px] flex-col rounded bg-[#f1f2f4]"
          >
            <div className="flex h-11 items-center justify-between px-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#44546f]">
                {column.label}
              </h2>
              <span className="rounded bg-[#dfe1e6] px-1.5 py-0.5 text-xs font-semibold text-[#44546f]">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 px-2 pb-2">
              {columnTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded border border-[#dfe1e6] bg-white p-3 shadow-[0_1px_1px_rgba(9,30,66,0.16)] transition hover:border-[#b3b9c4]"
                >
                  <h3 className="line-clamp-2 text-sm font-medium leading-5 text-[#172b4d]">
                    {task.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {task.sprint ? (
                      <span className="rounded border border-[#dfe1e6] bg-white px-1.5 py-0.5 text-xs text-[#44546f]">
                        {task.sprint.name}
                      </span>
                    ) : null}
                    {task.storyPoints ? (
                      <span className="rounded border border-[#dfe1e6] bg-white px-1.5 py-0.5 text-xs text-[#44546f]">
                        {task.storyPoints} SP
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs font-medium text-[#6b778c]">
                        {task.taskCode}
                      </span>
                      <span className={`text-xs font-semibold ${priorityClass(task.priority)}`}>
                        {priorityLabel(task.priority)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {formatDate(task.dueDate) ? (
                        <span className="rounded border border-[#dfe1e6] px-1.5 py-0.5 text-xs text-[#44546f]">
                          {formatDate(task.dueDate)}
                        </span>
                      ) : null}
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00875a] text-xs font-semibold text-white"
                        title={task.assignee?.fullName ?? "Chưa gán"}
                      >
                        {task.assignee?.fullName ? task.assignee.fullName.charAt(0).toUpperCase() : "-"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}

              {columnTasks.length === 0 ? (
                <div className="rounded border-2 border-dashed border-[#dfe1e6] px-3 py-8 text-center text-sm font-medium text-[#6b778c]">
                  Chưa có task
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
