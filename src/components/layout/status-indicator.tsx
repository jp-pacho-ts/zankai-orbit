import * as React from "react";

interface StatusIndicatorProps {
  label?: string;
  isPaused?: boolean;
}

export function StatusIndicator({
  label = "Orbit Live",
  isPaused = false,
}: StatusIndicatorProps) {
  return (
    <div className="workspace-status" role="status" aria-label={`Status: ${label}`}>
      <span className={`glow ${isPaused ? "paused" : ""}`} />
      <span>{label}</span>
    </div>
  );
}
