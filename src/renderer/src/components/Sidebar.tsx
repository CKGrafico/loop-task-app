import type { Instance, InstanceHealth } from "../types";

const HEALTH_COLORS: Record<InstanceHealth, string> = {
  ok: "#4ade80",
  offline: "#f87171",
  unknown: "#8a877f",
};

export function Sidebar(props: {
  instances: Instance[];
  selectedId: string | null;
  health: Record<string, InstanceHealth>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}): React.ReactNode {
  const { instances, selectedId, health, onSelect, onAdd, onRemove } = props;

  return (
    <div className="sidebar">
      <button className="sidebar-action" onClick={onAdd}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
        <span>Add instance</span>
      </button>

      <div className="sidebar-section">
        <span>Instances</span>
        <span>{instances.length || ""}</span>
      </div>

      <div className="sidebar-list">
        {instances.length === 0 ? (
          <div style={{ padding: "6px 10px", fontSize: 12.5, color: "var(--text-muted)" }}>
            No instances yet
          </div>
        ) : (
          instances.map((instance) => (
            <button
              key={instance.id}
              className={`instance-item${instance.id === selectedId ? " selected" : ""}`}
              onClick={() => onSelect(instance.id)}
              title={instance.baseUrl}
            >
              <span
                className="dot"
                style={{ background: HEALTH_COLORS[health[instance.id] ?? "unknown"] }}
              />
              <span className="name">{instance.name}</span>
              <span
                className="remove"
                role="button"
                title="Remove instance"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Remove instance "${instance.name}"?`)) {
                    onRemove(instance.id);
                  }
                }}
              >
                ✕
              </span>
            </button>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <span className="avatar">LT</span>
        <span>Loop Task App</span>
      </div>
    </div>
  );
}
