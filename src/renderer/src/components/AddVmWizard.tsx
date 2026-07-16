import { useEffect, useState } from "react";
import { useIntl, type IntlShape } from "react-intl";
import type { SshHost, VmWizardProgress, VmWizardServiceSelection, VmWizardServiceStatus, VmWizardStep } from "../../shared/ipc";
import { ShieldCheck, X, Check, Loader, SkipForward } from "lucide-react";
import { translateMessage } from "../i18n";

const STEP_LABEL_KEYS: Record<VmWizardStep, string> = {
  idle: "",
  "pick-target": "vmWizard.stepPickTarget",
  probing: "vmWizard.stepProbing",
  "pick-services": "vmWizard.stepPickServices",
  installing: "vmWizard.stepInstalling",
  forwarding: "vmWizard.stepForwarding",
  pairing: "vmWizard.stepPairing",
  consent: "vmWizard.stepConsent",
  done: "vmWizard.stepDone",
  error: "vmWizard.stepError",
};

function stepLabel(intl: IntlShape, step: VmWizardStep): string {
  const key = STEP_LABEL_KEYS[step];
  return key ? intl.formatMessage({ id: key }) : "";
}

const STEP_ORDER: VmWizardStep[] = [
  "pick-target",
  "probing",
  "pick-services",
  "consent",
  "installing",
  "forwarding",
  "pairing",
  "done",
];

function stepIndex(step: VmWizardStep): number {
  const idx = STEP_ORDER.indexOf(step);
  return idx >= 0 ? idx : 0;
}

export function AddVmWizard(props: {
  onDone: (environmentId: string, environmentName: string, daemonUrl: string) => void;
  onCancel: () => void;
}): React.ReactNode {
  const { onDone, onCancel } = props;
  const intl = useIntl();

  const [target, setTarget] = useState("");
  const [envName, setEnvName] = useState("");
  const [hosts, setHosts] = useState<SshHost[]>([]);
  const [hostsLoaded, setHostsLoaded] = useState(false);
  const [progress, setProgress] = useState<VmWizardProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [doneResult, setDoneResult] = useState<{ environmentId: string; environmentName: string; daemonUrl: string } | null>(null);
  const [serviceSelection, setServiceSelection] = useState<VmWizardServiceSelection>({
    installLoopTask: true,
    installOpenCode: true,
  });

  useEffect(() => {
    if (!window.api) return;
    let cancelled = false;
    void window.api.vmWizard.listSshHosts().then((h: SshHost[]) => {
      if (cancelled) return;
      setHosts(h);
      setHostsLoaded(true);
    }).catch(() => {
      if (cancelled) return;
      setHostsLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!window.api) return;
    const unsub = window.api.vmWizard.onProgress((p: VmWizardProgress) => {
      setProgress(p);
      if (p.serviceSelection) setServiceSelection(p.serviceSelection);
      if (p.step === "done" || p.step === "error") {
        setRunning(false);
      }
    });
    return unsub;
  }, []);

  const startWizard = async (): Promise<void> => {
    const trimmed = target.trim();
    if (!trimmed) return;

    setRunning(true);
    setProgress(null);

    try {
      const result = await window.api!.vmWizard.startWizard(trimmed, envName.trim() || undefined);
      setDoneResult(result);
    } catch {
      // progress already set via onProgress
    }
  };

  const selectHost = (h: SshHost): void => {
    setTarget(h.label);
    setEnvName(h.hostName ?? h.host);
  };

  const handleCancel = (): void => {
    if (running && window.api) {
      void window.api.vmWizard.cancelWizard();
    }
    onCancel();
  };

  const currentStep = progress?.step ?? "idle";
  const isDone = currentStep === "done";
  const isError = currentStep === "error";
  const isConsent = currentStep === "consent";
  const isPickServices = currentStep === "pick-services";
  const isInstalling = currentStep === "installing";

  function serviceStatusIcon(status: VmWizardServiceStatus): React.ReactNode {
    switch (status) {
      case "already-running": return <Check size={12} style={{ color: "var(--accent)" }} />;
      case "installed":
      case "started": return <Check size={12} style={{ color: "var(--accent)" }} />;
      case "installing":
      case "pending": return <Loader size={12} className="spinning" style={{ color: "var(--text-muted)" }} />;
      case "skipped": return <SkipForward size={12} style={{ color: "var(--text-muted)" }} />;
      case "failed": return <X size={12} style={{ color: "var(--danger)" }} />;
      default: return null;
    }
  }

  function serviceStatusLabel(status: VmWizardServiceStatus): string {
    switch (status) {
      case "already-running": return intl.formatMessage({ id: "vmWizard.serviceStatusAlreadyRunning" });
      case "installing": return intl.formatMessage({ id: "vmWizard.serviceStatusInstalling" });
      case "installed": return intl.formatMessage({ id: "vmWizard.serviceStatusInstalled" });
      case "started": return intl.formatMessage({ id: "vmWizard.serviceStatusStarted" });
      case "skipped": return intl.formatMessage({ id: "vmWizard.serviceStatusSkipped" });
      case "failed": return intl.formatMessage({ id: "vmWizard.serviceStatusFailed" });
      default: return "";
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 520 }}>
        <h2>{intl.formatMessage({ id: "vmWizard.title" })}</h2>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 14px" }}>
          {intl.formatMessage({ id: "vmWizard.description" })}
        </p>

        <div className="field">
          <label>{intl.formatMessage({ id: "vmWizard.name" })}</label>
          <input
            autoFocus
            placeholder={intl.formatMessage({ id: "vmWizard.namePlaceholder" })}
            value={envName}
            onChange={(e) => setEnvName(e.target.value)}
            disabled={running}
          />
        </div>

        <div className="field">
          <label>{intl.formatMessage({ id: "vmWizard.target" })}</label>
          <input
            placeholder={intl.formatMessage({ id: "vmWizard.targetPlaceholder" })}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !running && target.trim()) void startWizard();
            }}
            disabled={running}
            className="mono"
          />
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 6, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
            <ShieldCheck size={13} />
            <span>
              {intl.formatMessage({ id: "vmWizard.securityNote" })}
            </span>
          </div>
        </div>

        {hostsLoaded && hosts.length > 0 && !running ? (
          <div className="field">
            <label>{intl.formatMessage({ id: "vmWizard.sshConfigHosts" })}</label>
            <div className="tailscale-peers" style={{ maxHeight: 160 }}>
              {hosts.map((h) => (
                <div
                  key={h.host}
                  className={`tailscale-peer ${target === h.label ? "selected" : ""}`}
                  onClick={() => selectHost(h)}
                >
                  <span className="peer-name">{h.host}</span>
                  <span className="peer-ip mono">{h.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {progress ? (
          <div className="vm-wizard-progress" style={{ marginTop: 12 }}>
            <div className="vm-wizard-steps" style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {STEP_ORDER.map((step) => {
                const idx = stepIndex(step);
                const currentIdx = stepIndex(currentStep);
                const active = step === currentStep;
                const completed = idx < currentIdx || isDone;
                return (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: completed ? "var(--accent)" : active ? "var(--bg-active)" : "var(--bg-input)",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: 12.5, color: isError ? "var(--danger)" : "var(--text-secondary)" }}>
              {isError ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={14} />
                  {translateMessage(intl, progress.message)}
                </span>
              ) : isDone ? (
                <span style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Check size={14} />
                  {translateMessage(intl, progress.message)}
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="spinner" style={{ width: 12, height: 12, border: "2px solid var(--text-muted)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  {stepLabel(intl, currentStep)}: {translateMessage(intl, progress.message)}
                </span>
              )}
            </div>
            {progress.probe && !isDone ? (
              <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-muted)" }}>
                {progress.probe.nodeFound ? intl.formatMessage({ id: "vmWizard.nodeFound" }, { version: progress.probe.nodeVersion ?? "found" }) : intl.formatMessage({ id: "vmWizard.nodeNotFound" })}
                {" · "}
                {progress.probe.daemonRunning ? intl.formatMessage({ id: "vmWizard.daemonOnPort" }, { port: progress.probe.daemonPort ?? "?" }) : intl.formatMessage({ id: "vmWizard.daemonNotRunning" })}
                {" · "}
                {progress.probe.opencodeRunning ? intl.formatMessage({ id: "vmWizard.opencodeOnPort" }, { port: progress.probe.opencodePort ?? "?" }) : intl.formatMessage({ id: "vmWizard.opencodeNotRunning" })}
              </div>
            ) : null}
            {progress.launch?.logTail ? (
              <pre style={{ marginTop: 8, fontSize: 11, color: "var(--danger)", background: "var(--bg-log)", padding: 8, borderRadius: 6, maxHeight: 100, overflow: "auto" }}>
                {progress.launch.logTail}
              </pre>
            ) : null}
          </div>
        ) : null}

        {isPickServices ? (
          <div style={{ marginTop: 12, padding: 12, background: "var(--bg-log)", borderRadius: 8, border: "1px solid var(--bg-active)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
              {intl.formatMessage({ id: "vmWizard.pickServicesTitle" })}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 12 }}>
              {intl.formatMessage({ id: "vmWizard.pickServicesDescription" })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>
                  {intl.formatMessage({ id: "vmWizard.categoryCore" })}
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={serviceSelection.installLoopTask}
                    onChange={(e) => setServiceSelection((s) => ({ ...s, installLoopTask: e.target.checked }))}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{intl.formatMessage({ id: "vmWizard.serviceLoopTask" })}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{intl.formatMessage({ id: "vmWizard.serviceLoopTaskDesc" })}</div>
                  </div>
                </label>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>
                  {intl.formatMessage({ id: "vmWizard.categoryAI" })}
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={serviceSelection.installOpenCode}
                    onChange={(e) => setServiceSelection((s) => ({ ...s, installOpenCode: e.target.checked }))}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{intl.formatMessage({ id: "vmWizard.serviceOpenCode" })}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{intl.formatMessage({ id: "vmWizard.serviceOpenCodeDesc" })}</div>
                  </div>
                </label>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button
                className="btn primary"
                onClick={() => window.api?.vmWizard.respondServiceSelection(serviceSelection)}
              >
                {intl.formatMessage({ id: "vmWizard.confirmServices" })}
              </button>
            </div>
          </div>
        ) : null}

        {isInstalling && progress?.launch ? (
          <div style={{ marginTop: 12, padding: 12, background: "var(--bg-log)", borderRadius: 8, border: "1px solid var(--bg-active)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>
                  {intl.formatMessage({ id: "vmWizard.categoryCore" })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  {serviceStatusIcon(progress.launch.loopTaskStatus)}
                  <span>{intl.formatMessage({ id: "vmWizard.serviceLoopTask" })}</span>
                  {progress.launch.loopTaskStatus !== "pending" ? (
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      — {serviceStatusLabel(progress.launch.loopTaskStatus)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>
                  {intl.formatMessage({ id: "vmWizard.categoryAI" })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  {serviceStatusIcon(progress.launch.openCodeStatus)}
                  <span>{intl.formatMessage({ id: "vmWizard.serviceOpenCode" })}</span>
                  {progress.launch.openCodeStatus !== "pending" ? (
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      — {serviceStatusLabel(progress.launch.openCodeStatus)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isConsent && progress?.consentPrompt ? (
          <div style={{
            marginTop: 12,
            padding: 12,
            background: "var(--bg-log)",
            borderRadius: 8,
            border: "1px solid var(--bg-active)",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
              <ShieldCheck size={16} />
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {translateMessage(intl, progress.consentPrompt)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn primary"
                onClick={() => window.api?.vmWizard.respondConsent("install")}
              >
                {intl.formatMessage({ id: "vmWizard.installViaMise" })}
              </button>
              <button
                className="btn"
                onClick={() => window.api?.vmWizard.respondConsent("skip")}
              >
                {intl.formatMessage({ id: "vmWizard.skip" })}
              </button>
            </div>
          </div>
        ) : null}

        <div className="modal-actions">
          <button className="btn" onClick={() => doneResult ? onDone(doneResult.environmentId, doneResult.environmentName, doneResult.daemonUrl) : handleCancel()}>
            {running ? intl.formatMessage({ id: "vmWizard.cancel" }) : intl.formatMessage({ id: "vmWizard.close" })}
          </button>
          {!isDone ? (
            <button
              className="btn primary"
              onClick={() => void startWizard()}
              disabled={running || !target.trim()}
            >
              {running ? intl.formatMessage({ id: "vmWizard.running" }) : intl.formatMessage({ id: "vmWizard.startWizard" })}
            </button>
          ) : null}
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
