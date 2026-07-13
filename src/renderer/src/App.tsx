import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectionStatus } from "../../shared/ipc";
import type { Instance, InstanceHealth, LoopMeta, Section } from "./types";
import { useInstances } from "./store";
import { fetchLoops, isMock } from "./api";
import { Sidebar } from "./components/Sidebar";
import { SegmentedTabs } from "./components/SegmentedTabs";
import { AddInstanceModal } from "./components/AddInstanceModal";
import { LoopsView } from "./components/LoopsView";
import { LoopDetail } from "./components/LoopDetail";
import { TasksView } from "./components/TasksView";
import { ProjectsView } from "./components/ProjectsView";
import { Icon } from "./components/Icon";
import { hostLabel, timeAgo } from "./format";

type View = { kind: "list" } | { kind: "loop"; loopId: string };

const SECTION_LABELS: Record<Section, string> = {
  loops: "Loops",
  tasks: "Tasks",
  projects: "Projects",
};

function phaseToHealth(phase: ConnectionStatus["phase"]): InstanceHealth {
  switch (phase) {
    case "connected":
      return "ok";
    case "connecting":
      return "connecting";
    case "backoff":
      return "backoff";
    case "blocked":
      return "blocked";
    case "offline":
      return "offline";
    default:
      return "unknown";
  }
}

export function App(): React.ReactNode {
  const { instances, selectedId, select, add, remove } = useInstances();
  const [section, setSection] = useState<Section>("loops");
  const [view, setView] = useState<View>({ kind: "list" });
  const [filter, setFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [health, setHealth] = useState<Record<string, InstanceHealth>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({});
  const [loops, setLoops] = useState<LoopMeta[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const filterRef = useRef<HTMLInputElement | null>(null);

  const selected: Instance | null = instances.find((i) => i.id === selectedId) ?? null;

  // Listen to connection supervisor status changes pushed from main process.
  // In mock mode, fall back to simple poll-based health.
  useEffect(() => {
    if (!window.api) return;

    const unsub = window.api.connection.onStatusChange(
      (instanceId: string, status: ConnectionStatus) => {
        const h = phaseToHealth(status.phase);
        setHealth((prev) => (prev[instanceId] === h ? prev : { ...prev, [instanceId]: h }));
        setConnectionStatus((prev) =>
          prev[instanceId] === status ? prev : { ...prev, [instanceId]: status },
        );
      },
    );
    return unsub;
  }, []);

  // Mock-mode fallback: poll-based health (no supervisor in plain browser).
  useEffect(() => {
    if (window.api || instances.length === 0) return;
    let cancelled = false;

    const check = async (): Promise<void> => {
      for (const instance of instances) {
        const res = await fetchLoops(instance);
        if (cancelled) return;
        const h: InstanceHealth = res.ok ? "ok" : "offline";
        setHealth((prev) => (prev[instance.id] === h ? prev : { ...prev, [instance.id]: h }));
      }
    };

    void check();
    const timer = setInterval(() => void check(), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [instances]);

  // Initial status fetch for all instances on load / when instances change.
  useEffect(() => {
    if (!window.api || instances.length === 0) return;
    let cancelled = false;

    const fetchAll = async (): Promise<void> => {
      for (const instance of instances) {
        const status = await window.api!.connection.getStatus(instance.id);
        if (cancelled || !status) return;
        const h = phaseToHealth(status.phase);
        setHealth((prev) => (prev[instance.id] === h ? prev : { ...prev, [instance.id]: h }));
        setConnectionStatus((prev) =>
          prev[instance.id] === status ? prev : { ...prev, [instance.id]: status },
        );
      }
    };

    void fetchAll();
    return () => { cancelled = true; };
  }, [instances]);

  // Report OS online/offline to main process so supervisors can park.
  useEffect(() => {
    if (!window.api) return;

    const report = (): void => {
      window.api!.connection.notifyNetworkChanged(navigator.onLine);
    };

    window.addEventListener("online", report);
    window.addEventListener("offline", report);
    report();

    return () => {
      window.removeEventListener("online", report);
      window.removeEventListener("offline", report);
    };
  }, []);

  // Poll loops for the selected instance (data only; health is driven by the
  // connection supervisor). refreshTick allows a manual refresh.
  useEffect(() => {
    if (!selected) {
      setLoops([]);
      return;
    }

    // Only poll when the supervisor says we're connected.
    const connStatus = connectionStatus[selected.id];
    if (connStatus && connStatus.phase !== "connected") {
      setLoops([]);
      return;
    }

    let cancelled = false;

    const load = async (): Promise<void> => {
      const res = await fetchLoops(selected);
      if (cancelled) return;
      if (res.ok && Array.isArray(res.data)) {
        setLoops(res.data);
        setLastUpdated(Date.now());
      }
    };

    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selected?.id, selected?.baseUrl, refreshTick, connectionStatus[selected?.id ?? ""]?.phase]);

  const handleSelect = (id: string): void => {
    select(id);
    setSection("loops");
    setView({ kind: "list" });
    setFilter("");
  };

  const handleRetry = useCallback((id: string): void => {
    if (window.api) {
      void window.api.connection.retry(id);
    }
  }, []);

  const handleSection = (next: Section): void => {
    setSection(next);
    setView({ kind: "list" });
    setFilter("");
  };

  const handleAdd = (name: string, baseUrl: string): void => {
    void (async () => {
      const instance = await add(name, baseUrl);
      handleSelect(instance.id);
      setModalOpen(false);
    })();
  };

  const handleRemove = (id: string): void => {
    remove(id);
    setHealth((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const openLoop = (loopId: string): void => setView({ kind: "loop", loopId });
  const goBack = (): void => setView({ kind: "list" });

  const inDetail = view.kind === "loop";
  const updatedLabel =
    lastUpdated === null ? "…" : timeAgo(new Date(lastUpdated).toISOString());

  return (
    <div className="app">
      <div className="titlebar">
        <button
          className="icon-btn"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <Icon name="panelLeft" size={15} />
        </button>
        <button
          className="icon-btn"
          title="Search (focus filter)"
          onClick={() => filterRef.current?.focus()}
        >
          <Icon name="search" size={15} />
        </button>
        <button
          className="icon-btn"
          title="Back"
          disabled={!inDetail}
          style={!inDetail ? { opacity: 0.35, cursor: "default" } : undefined}
          onClick={goBack}
        >
          <Icon name="arrowLeft" size={15} />
        </button>
        <span className="titlebar-brand">Loop Task</span>
        <span className="titlebar-tag">{isMock ? "mock" : "preview"}</span>
      </div>

      <div className="body">
        {sidebarOpen ? (
          <aside className="panel sidebar-panel">
            <SegmentedTabs active={section} onChange={handleSection} disabled={!selected} />
            <Sidebar
              instances={instances}
              selectedId={selectedId}
              health={health}
              connectionStatus={connectionStatus}
              onSelect={handleSelect}
              onAdd={() => setModalOpen(true)}
              onRemove={handleRemove}
              onRetry={handleRetry}
            />
          </aside>
        ) : null}

        <div className="panel main-panel">
          {selected ? (
            <div className="main-header">
              <span className="main-title">{selected.name}</span>
              <span className="chip mono">{hostLabel(selected.baseUrl)}</span>
              <span className="main-header-meta">
                {(() => {
                  const h = health[selected.id] ?? "unknown";
                  const cs = connectionStatus[selected.id];
                  if (cs && cs.phase === "blocked" && cs.lastError) {
                    return `blocked: ${cs.lastError}`;
                  }
                  if (h === "offline" || h === "backoff" || h === "blocked" || h === "connecting") {
                    return h;
                  }
                  return `updated ${updatedLabel}`;
                })()}
              </span>
            </div>
          ) : null}

          <div className="content">
            {!selected ? (
              <div className="empty">
                <span className="glyph">
                  <Icon name="rotate" size={30} strokeWidth={1.2} />
                </span>
                <h3>No instance selected</h3>
                <p>
                  Add a loop-task instance by its API URL (for example{" "}
                  <code>http://127.0.0.1:8845</code>) to see its loops, tasks, and projects.
                </p>
                <button className="btn primary" onClick={() => setModalOpen(true)}>
                  Add instance
                </button>
              </div>
            ) : inDetail ? (
              <LoopDetail
                instance={selected}
                loopId={(view as { kind: "loop"; loopId: string }).loopId}
                initial={loops.find((l) => l.id === (view as { loopId: string }).loopId) ?? null}
                onBack={goBack}
              />
            ) : section === "loops" ? (
              <LoopsView
                instance={selected}
                loops={loops}
                filter={filter}
                health={health[selected.id] ?? "unknown"}
                onOpenLoop={openLoop}
              />
            ) : section === "tasks" ? (
              <TasksView instance={selected} filter={filter} />
            ) : (
              <ProjectsView instance={selected} loops={loops} filter={filter} />
            )}
          </div>

          {selected && !inDetail ? (
            <div className="prompt-bar">
              <div className="prompt-box">
                <input
                  ref={filterRef}
                  placeholder={`Filter ${SECTION_LABELS[section].toLowerCase()}…`}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <div className="prompt-row">
                  <span className="prompt-chip">{SECTION_LABELS[section]}</span>
                  <span className="prompt-meta">{hostLabel(selected.baseUrl)}</span>
                  <span style={{ flex: 1 }} />
                  {section === "loops" ? (
                    <span className="prompt-meta mono">{loops.length} loops</span>
                  ) : null}
                  <button
                    className="prompt-action"
                    title="Refresh now"
                    onClick={() => setRefreshTick((n) => n + 1)}
                  >
                    <Icon name="rotate" size={14} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {modalOpen ? (
        <AddInstanceModal onSubmit={handleAdd} onCancel={() => setModalOpen(false)} />
      ) : null}
    </div>
  );
}
