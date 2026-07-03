import { useEffect, useMemo, useState } from "react";
import type { Instance, InstanceHealth, LoopMeta, Project } from "../types";
import { fetchProjects } from "../api";
import { STATUS_COLORS, commandLine, timeAgo, timeUntil } from "../format";

function loopLabel(loop: LoopMeta): string {
  return loop.description?.trim() || commandLine(loop.command, loop.commandArgs);
}

export function LoopsView(props: {
  instance: Instance;
  loops: LoopMeta[];
  filter: string;
  health: InstanceHealth;
  onOpenLoop: (id: string) => void;
}): React.ReactNode {
  const { instance, loops, filter, health, onOpenLoop } = props;
  const [projects, setProjects] = useState<Project[]>([]);

  // Project colors for the row dots — fetched once per instance.
  useEffect(() => {
    let cancelled = false;
    void fetchProjects(instance).then((res) => {
      if (!cancelled && res.ok && Array.isArray(res.data)) setProjects(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [instance.id, instance.baseUrl]);

  const projectColor = (loop: LoopMeta): string | undefined =>
    projects.find((p) => p.id === loop.projectId)?.color;

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return loops;
    return loops.filter(
      (l) =>
        loopLabel(l).toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q),
    );
  }, [loops, filter]);

  return (
    <div className="content-inner">
      <div className="view-header">
        <h1>Loops</h1>
        <span className="chip">{loops.length}</span>
      </div>

      {loops.length === 0 ? (
        <div className="empty">
          <div className="glyph">↻</div>
          <h3>{health === "offline" ? "Instance unreachable" : "No loops"}</h3>
          <p>
            {health === "offline"
              ? `Could not reach ${instance.baseUrl}. Is the loop-task daemon running?`
              : "This instance has no loops yet. Create one with the loop-task CLI or board."}
          </p>
        </div>
      ) : (
        <div className="loop-list">
          {visible.map((loop) => {
            const failed = loop.lastExitCode !== null && loop.lastExitCode !== 0;
            return (
              <button key={loop.id} className="loop-row" onClick={() => onOpenLoop(loop.id)}>
                <span
                  className="dot"
                  title={loop.status}
                  style={{ background: STATUS_COLORS[loop.status] ?? "#8a877f" }}
                />
                <span className="desc">{loopLabel(loop)}</span>
                {projectColor(loop) ? (
                  <span
                    className="dot"
                    title="project"
                    style={{ background: projectColor(loop), width: 6, height: 6 }}
                  />
                ) : null}
                <span className="right">
                  <span className="chip mono">{loop.intervalHuman}</span>
                  <span title="runs">{loop.runCount} runs</span>
                  {failed ? (
                    <span className="exit-bad" title={`last exit ${loop.lastExitCode}`}>
                      ✗ {loop.lastExitCode}
                    </span>
                  ) : null}
                  <span
                    className="status"
                    style={{ color: STATUS_COLORS[loop.status] ?? "var(--text-muted)" }}
                  >
                    {loop.status}
                  </span>
                  <span style={{ width: 64, textAlign: "right" }}>
                    {loop.status === "running"
                      ? timeAgo(loop.lastRunAt)
                      : loop.nextRunAt
                        ? timeUntil(loop.nextRunAt)
                        : "—"}
                  </span>
                </span>
              </button>
            );
          })}
          {visible.length === 0 ? (
            <div style={{ padding: "18px 12px", color: "var(--text-muted)", fontSize: 13 }}>
              No loops match “{filter}”.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
