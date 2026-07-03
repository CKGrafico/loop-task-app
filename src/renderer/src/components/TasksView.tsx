import { useEffect, useState } from "react";
import type { Instance, TaskDefinition } from "../types";
import { fetchTasks } from "../api";
import { commandLine } from "../format";

export function TasksView(props: { instance: Instance; filter: string }): React.ReactNode {
  const { instance, filter } = props;
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const res = await fetchTasks(instance);
      if (!cancelled && res.ok && Array.isArray(res.data)) {
        setTasks(res.data);
        setLoaded(true);
      }
    };
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [instance.id, instance.baseUrl]);

  const nameOf = (id: string | null): string | null =>
    id ? (tasks.find((t) => t.id === id)?.name ?? id.slice(0, 8)) : null;

  const q = filter.trim().toLowerCase();
  const visible = q
    ? tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          commandLine(t.command, t.commandArgs).toLowerCase().includes(q),
      )
    : tasks;

  return (
    <div className="content-inner">
      <div className="view-header">
        <h1>Tasks</h1>
        <span className="chip">{tasks.length}</span>
      </div>

      {loaded && tasks.length === 0 ? (
        <div className="empty">
          <div className="glyph">≔</div>
          <h3>No tasks</h3>
          <p>This instance has no reusable tasks yet.</p>
        </div>
      ) : (
        <div className="loop-list">
          {visible.map((task) => {
            const onOk = nameOf(task.onSuccessTaskId);
            const onFail = nameOf(task.onFailureTaskId);
            return (
              <div key={task.id} className="loop-row static">
                <span className="dot" style={{ background: "var(--accent-task)" }} />
                <span className="desc">{task.name}</span>
                <span className="right">
                  <span className="chip mono">{commandLine(task.command, task.commandArgs)}</span>
                  {onOk ? (
                    <span title="on success" style={{ color: "var(--success)" }}>
                      ✓ → {onOk}
                    </span>
                  ) : null}
                  {onFail ? (
                    <span title="on failure" style={{ color: "var(--danger)" }}>
                      ✗ → {onFail}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
          {q && visible.length === 0 ? (
            <div style={{ padding: "18px 12px", color: "var(--text-muted)", fontSize: 13 }}>
              No tasks match “{filter}”.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
