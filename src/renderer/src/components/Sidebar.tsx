import type { ConnectionStatus } from "../../../shared/ipc";
import type { Instance, InstanceHealth } from "../types";
import { Icon } from "./Icon";

const HEALTH_COLORS: Record<InstanceHealth, string> = {
  ok: "#a9d95c",
  offline: "#ff8484",
  unknown: "#64718c",
  connecting: "#f0c040",
  backoff: "#f08040",
  blocked: "#e040e0",
};

function healthTooltip(health: InstanceHealth, status?: ConnectionStatus | null): string {
  if (status) {
    switch (status.phase) {
      case "connected": return "Connected";
      case "connecting": return "Connecting…";
      case "backoff": return `Retrying in ${Math.round(status.backoffMs / 1000)}s (${status.failureCount} failures)`;
      case "blocked": return status.lastError ?? "Blocked";
      case "offline": return status.lastError ?? "Offline — no network";
    }
  }
  return health;
}

export function Sidebar(props: {
  instances: Instance[];
  selectedId: string | null;
  health: Record<string, InstanceHealth>;
  connectionStatus?: Record<string, ConnectionStatus>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}): React.ReactNode {
  const { instances, selectedId, health, connectionStatus, onSelect, onAdd, onRemove, onRetry } = props;

  return (
    <div className="sidebar">
      <button className="sidebar-action" onClick={onAdd}>
        <Icon name="plus" size={14} />
        <span>Add instance</span>
      </button>

      <div className="sidebar-section">
        <span className="overline">Instances</span>
        <span className="overline">{instances.length || ""}</span>
      </div>

      <div className="sidebar-list">
        {instances.length === 0 ? (
          <div style={{ padding: "6px 10px", fontSize: 12.5, color: "var(--text-muted)" }}>
            No instances yet
          </div>
        ) : (
          instances.map((instance) => {
            const h = health[instance.id] ?? "unknown";
            const cs = connectionStatus?.[instance.id];
            return (
            <button
              key={instance.id}
              className={`instance-item${instance.id === selectedId ? " selected" : ""}`}
              onClick={() => onSelect(instance.id)}
              title={healthTooltip(h, cs)}
            >
              <span
                className="dot"
                style={{ background: HEALTH_COLORS[h] }}
              />
              <span className="name">{instance.name}</span>
              {(h === "backoff" || h === "blocked") && onRetry ? (
                <span
                  className="remove"
                  role="button"
                  title="Retry connection"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry(instance.id);
                  }}
                >
                  <Icon name="rotate" size={12} />
                </span>
              ) : null}
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
                <Icon name="x" size={12} />
              </span>
            </button>
            );
          })
        )}
      </div>

      <div className="sidebar-footer">
        <span className="avatar">OB</span>
        <span>Orbion</span>
      </div>
    </div>
  );
}
