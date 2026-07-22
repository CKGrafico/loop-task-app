import { useState } from "react";
import { useIntl } from "react-intl";
import { translateMessage } from "../i18n";
import type { StaleConfigResult, PullRestoreResult } from "../../../shared/ipc";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Stale-config warning dialog: shown when a stamp-checked write detects
 * that the config was modified on another machine.
 * Offers two choices: pull-remote (replace local with config-home) or
 * overwrite-anyway (force the write, last-write-wins).
 */
export function StaleConfigWarning({
  staleResult,
  onPullRemote,
  onOverwriteAnyway,
  onCancel,
  open = true,
  onOpenChange,
}: {
  staleResult: StaleConfigResult;
  onPullRemote: () => Promise<PullRestoreResult>;
  onOverwriteAnyway: () => Promise<void>;
  onCancel: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}): React.ReactNode {
  const intl = useIntl();
  const [acting, setActing] = useState<"pull" | "overwrite" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePullRemote(): Promise<void> {
    setActing("pull");
    setError(null);
    const result = await onPullRemote();
    if (!result.ok) {
      setActing(null);
      setError(translateMessage(intl, result.error) ?? intl.formatMessage({ id: "staleConfig.pullFailed" }, { error: "Unknown error" }));
    }
  }

  async function handleOverwriteAnyway(): Promise<void> {
    setActing("overwrite");
    setError(null);
    try {
      await onOverwriteAnyway();
    } catch (err) {
      setActing(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{intl.formatMessage({ id: "staleConfig.title" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {intl.formatMessage({ id: "staleConfig.description" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="stale-config-error">{error}</p>
        )}
        <AlertDialogFooter>
          {acting ? (
            <span className="stale-config-progress">
              {acting === "pull"
                ? intl.formatMessage({ id: "staleConfig.pulling" })
                : intl.formatMessage({ id: "staleConfig.overwriteSucceeded" })}
            </span>
          ) : (
            <>
              <AlertDialogCancel onClick={onCancel}>
                {intl.formatMessage({ id: "restore.skipAction" })}
              </AlertDialogCancel>
              <Button variant="outline" onClick={() => void handleOverwriteAnyway()}>
                {intl.formatMessage({ id: "staleConfig.overwriteAnyway" })}
              </Button>
              <AlertDialogAction onClick={() => void handlePullRemote()}>
                {intl.formatMessage({ id: "staleConfig.pullRemote" })}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
