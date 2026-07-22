import { useState } from "react";
import { useIntl } from "react-intl";
import { translateMessage } from "../i18n";
import type { RestoreAvailability, PullRestoreResult } from "../../../shared/ipc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Restore-offer dialog: shown when a config-home VM has a config file
 * available for pull-canonical restore.
 */
export function RestoreOffer({
  availability,
  onRestore,
  onSkip,
  open = true,
  onOpenChange,
}: {
  availability: RestoreAvailability & { available: true };
  onRestore: () => Promise<PullRestoreResult>;
  onSkip: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}): React.ReactNode {
  const intl = useIntl();
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore(): Promise<void> {
    setRestoring(true);
    setError(null);
    const result = await onRestore();
    if (!result.ok) {
      setRestoring(false);
      setError(translateMessage(intl, result.error) ?? intl.formatMessage({ id: "restore.restoreFailed" }, { error: "Unknown error" }));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{intl.formatMessage({ id: "restore.availableTitle" })}</DialogTitle>
          <DialogDescription>
            {intl.formatMessage(
              { id: "restore.availableCopy" },
              {
                count: availability.environmentCount,
                names: availability.environmentNames.join(", "),
              },
            )}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="restore-offer-error">{error}</p>
        )}
        <DialogFooter>
          {restoring ? (
            <span className="restore-offer-progress">
              {intl.formatMessage({ id: "restore.restoringTitle" })}
            </span>
          ) : (
            <>
              <Button onClick={() => void handleRestore()}>
                {intl.formatMessage({ id: "restore.restoreAction" })}
              </Button>
              <Button variant="outline" onClick={onSkip}>
                {intl.formatMessage({ id: "restore.skipAction" })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
