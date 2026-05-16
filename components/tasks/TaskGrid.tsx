import { TaskCard } from "./TaskCard";
import type { TaskCard as TaskCardType } from "@/lib/api/types";

interface TaskGridProps {
  tasks: TaskCardType[];
}

export function TaskGrid({ tasks }: TaskGridProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </div>
  );
}
