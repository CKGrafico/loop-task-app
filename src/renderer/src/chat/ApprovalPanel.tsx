import React, { useCallback } from "react";
import type { ApprovalRequest, ApprovalDecision } from "./types";

interface ApprovalPanelProps {
  approval: ApprovalRequest;
  onDecision: (approvalId: string, decision: ApprovalDecision) => void;
}

const DECISION_CONFIG: Array<{ value: ApprovalDecision; label: string; className: string }> = [
  { value: "approve-once", label: "Approve once", className: "approval-btn approve" },
  { value: "approve-always", label: "Always allow", className: "approval-btn always" },
  { value: "decline", label: "Decline", className: "approval-btn decline" },
  { value: "cancel", label: "Cancel turn", className: "approval-btn cancel" },
];

export function ApprovalPanel({ approval, onDecision }: ApprovalPanelProps) {
  const handleDecision = useCallback(
    (decision: ApprovalDecision) => {
      onDecision(approval.id, decision);
    },
    [approval.id, onDecision],
  );

  return (
    <div className="approval-panel">
      <div className="approval-header">
        <span className="approval-icon">⚠</span>
        <span className="approval-title">Approval required</span>
      </div>
      <div className="approval-body">
        <span className="approval-description">{approval.description}</span>
        {approval.command && (
          <code className="approval-detail mono">{approval.command}</code>
        )}
        {approval.filePath && (
          <code className="approval-detail mono">{approval.filePath}</code>
        )}
      </div>
      <div className="approval-actions">
        {DECISION_CONFIG.map((cfg) => (
          <button
            key={cfg.value}
            className={cfg.className}
            onClick={() => handleDecision(cfg.value)}
          >
            {cfg.label}
          </button>
        ))}
      </div>
    </div>
  );
}
