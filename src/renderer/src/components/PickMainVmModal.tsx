import React from "react";
import { useIntl } from "react-intl";
import type { Environment } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PickMainVmModalProps {
  candidates: Environment[];
  onPick: (environmentId: string) => void;
  onSkip: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PickMainVmModal({ candidates, onPick, onSkip, open = true, onOpenChange }: PickMainVmModalProps): React.ReactNode {
  const intl = useIntl();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{intl.formatMessage({ id: "pickMainVm.title" })}</DialogTitle>
          <DialogDescription>
            {intl.formatMessage({ id: "pickMainVm.description" })}
          </DialogDescription>
        </DialogHeader>
        <div className="pick-main-vm-list">
          {candidates.map((env) => (
            <button
              key={env.id}
              className="pick-main-vm-item"
              onClick={() => onPick(env.id)}
            >
              <span className="name">{env.name}</span>
              <span className="stat" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {env.endpoints[0]?.url ?? intl.formatMessage({ id: "pickMainVm.noEndpoint" })}
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onSkip}>{intl.formatMessage({ id: "pickMainVm.skip" })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
