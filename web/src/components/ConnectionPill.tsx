import type { ConnectionMode } from "@shared/types";

const LABEL: Record<ConnectionMode, string> = {
  live: "LIVE",
  polling: "POLLING (2s)",
  offline: "OFFLINE",
};

const CLASS: Record<ConnectionMode, string> = {
  live: "connection-pill connection-pill--live",
  polling: "connection-pill connection-pill--polling",
  offline: "connection-pill connection-pill--offline",
};

export function ConnectionPill({
  mode,
  showRetry,
  onRetry,
}: {
  mode: ConnectionMode;
  showRetry?: boolean;
  onRetry?: () => void;
}) {
  return (
    <span className={CLASS[mode]} role="status" aria-live="polite">
      {LABEL[mode]}
      {showRetry && onRetry ? (
        <button
          type="button"
          className="connection-pill__retry"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </span>
  );
}
