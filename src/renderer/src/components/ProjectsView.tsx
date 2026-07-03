import { useEffect, useState } from "react";
import type { Instance, LoopMeta, Project } from "../types";
import { fetchProjects } from "../api";

export function ProjectsView(props: {
  instance: Instance;
  loops: LoopMeta[];
  filter: string;
}): React.ReactNode {
  const { instance, loops, filter } = props;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const res = await fetchProjects(instance);
      if (!cancelled && res.ok && Array.isArray(res.data)) {
        setProjects(res.data);
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

  const loopCount = (projectId: string): number =>
    loops.filter((l) => (l.projectId ?? "default") === projectId).length;

  const q = filter.trim().toLowerCase();
  const visible = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;

  return (
    <div className="content-inner">
      <div className="view-header">
        <h1>Projects</h1>
        <span className="chip">{projects.length}</span>
      </div>

      {loaded && projects.length === 0 ? (
        <div className="empty">
          <div className="glyph">▣</div>
          <h3>No projects</h3>
          <p>This instance has no projects yet.</p>
        </div>
      ) : (
        <div className="loop-list">
          {visible.map((project) => (
            <div key={project.id} className="loop-row static">
              <span className="dot" style={{ background: project.color }} />
              <span className="desc">{project.name}</span>
              <span className="right">
                {project.isSystem ? <span className="chip">system</span> : null}
                <span>{loopCount(project.id)} loops</span>
                <span>{project.createdAt.slice(0, 10)}</span>
              </span>
            </div>
          ))}
          {q && visible.length === 0 ? (
            <div style={{ padding: "18px 12px", color: "var(--text-muted)", fontSize: 13 }}>
              No projects match “{filter}”.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
