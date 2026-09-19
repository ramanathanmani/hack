import type { ConnectionMode } from "@shared/types";
import { ConnectionPill } from "./ConnectionPill";
import { Link } from "../router";

export function FramingHeader({
  centers,
  sessions,
  incidents,
  connection,
  showRetry,
  onRetry,
  currentPath,
}: {
  centers: number;
  sessions: number;
  incidents: number;
  connection: ConnectionMode;
  showRetry?: boolean;
  onRetry?: () => void;
  currentPath: string;
}) {
  return (
    <header className="framing-header">
      <div className="framing-header__identity">
        <span className="framing-header__brand">Sentinel</span>
        <span className="framing-header__exam">
          Statewide Aptitude Exam — Live
        </span>
        <span className="framing-header__counts">
          {centers} centers · {sessions} sessions · {incidents} incidents
        </span>
      </div>
      <div className="framing-header__right">
        {currentPath === "/audit" ? (
          <Link to="/">Back to Control Tower</Link>
        ) : (
          <Link to="/audit">Chain Integrity</Link>
        )}
        <ConnectionPill mode={connection} showRetry={showRetry} onRetry={onRetry} />
      </div>
    </header>
  );
}
