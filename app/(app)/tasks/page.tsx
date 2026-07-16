import { Suspense } from "react";
import { TasksView } from "@/components/tasks/TasksView";

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading tasks…</p>}>
      <TasksView />
    </Suspense>
  );
}
