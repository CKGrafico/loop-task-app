import { useState } from "react";
import { apiRequest } from "../api";

export function AddInstanceModal(props: {
  onSubmit: (name: string, baseUrl: string) => void;
  onCancel: () => void;
}): React.ReactNode {
  const { onSubmit, onCancel } = props;
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:8845");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const submit = async (): Promise<void> => {
    const trimmedName = name.trim();
    const trimmedUrl = baseUrl.trim().replace(/\/+$/, "");

    if (!trimmedName) {
      setError("Give this instance a name.");
      return;
    }
    try {
      const url = new URL(trimmedUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
    } catch {
      setError("Enter a valid http(s) URL, e.g. http://127.0.0.1:8845");
      return;
    }

    setChecking(true);
    setError(null);
    const probe = await apiRequest(
      { id: "probe", name: trimmedName, baseUrl: trimmedUrl },
      "/api/loops",
    );
    setChecking(false);

    if (!probe.ok) {
      setError(`Could not reach the instance: ${probe.error ?? "unknown error"}`);
      return;
    }
    onSubmit(trimmedName, trimmedUrl);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add loop-task instance</h2>

        <div className="field">
          <label>Name</label>
          <input
            autoFocus
            placeholder="Local daemon"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </div>

        <div className="field">
          <label>API URL</label>
          <input
            placeholder="http://127.0.0.1:8845"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
          {error ? <div className="error">{error}</div> : null}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => void submit()} disabled={checking}>
            {checking ? "Checking…" : "Add instance"}
          </button>
        </div>
      </div>
    </div>
  );
}
