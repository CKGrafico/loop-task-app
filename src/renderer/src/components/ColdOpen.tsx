import { useState } from "react";
import { useIntl } from "react-intl";
import { OrbionMark } from "./OrbionMark";
import { decodeBootstrapSeed } from "../../../shared/utils";
import type { BootstrapSeed } from "../../../shared/ipc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Cold-open empty state: shown when no instances/environments are configured.
 * A single centered card that teaches the user what Orbion is and
 * launches the add-instance wizard.
 */
export function ColdOpen({
  onAddVm,
  onImportSeed,
}: {
  onAddVm: () => void;
  onImportSeed: (seed: BootstrapSeed) => void;
}): React.ReactNode {
  const intl = useIntl();
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [seedString, setSeedString] = useState("");
  const [seedError, setSeedError] = useState(false);

  function handleImportClick(): void {
    setShowSeedInput(true);
    setSeedError(false);
  }

  function handleSeedConfirm(): void {
    const parsed = decodeBootstrapSeed(seedString);
    if (!parsed) {
      setSeedError(true);
      return;
    }
    onImportSeed(parsed);
  }

  function handleSeedCancel(): void {
    setShowSeedInput(false);
    setSeedString("");
    setSeedError(false);
  }

  return (
    <div className="cold-open">
      <OrbionMark size={40} />
      <h2 className="cold-open-headline">
        {intl.formatMessage({ id: "coldOpen.headline" })}
      </h2>
      <p className="cold-open-copy">
        {intl.formatMessage({ id: "coldOpen.copy" })}
      </p>
      <div className="cold-open-actions">
        <Button className="cold-open-btn" onClick={onAddVm}>
          {intl.formatMessage({ id: "coldOpen.addFirstMachine" })}
        </Button>
        <Button variant="outline" className="cold-open-btn" onClick={handleImportClick}>
          {intl.formatMessage({ id: "coldOpen.importSeed" })}
        </Button>
      </div>
      {showSeedInput && (
        <div className="cold-open-seed-dialog">
          <h3 className="cold-open-seed-title">
            {intl.formatMessage({ id: "coldOpen.importSeedTitle" })}
          </h3>
          <Input
            className="cold-open-seed-input"
            type="text"
            placeholder={intl.formatMessage({ id: "coldOpen.importSeedPlaceholder" })}
            value={seedString}
            onChange={(e) => {
              setSeedString(e.target.value);
              setSeedError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSeedConfirm();
              if (e.key === "Escape") handleSeedCancel();
            }}
            autoFocus
          />
          {seedError && (
            <p className="cold-open-seed-error">
              {intl.formatMessage({ id: "coldOpen.importSeedInvalid" })}
            </p>
          )}
          <div className="cold-open-seed-actions">
            <Button onClick={handleSeedConfirm}>
              {intl.formatMessage({ id: "coldOpen.importSeedConfirm" })}
            </Button>
            <Button variant="outline" onClick={handleSeedCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
