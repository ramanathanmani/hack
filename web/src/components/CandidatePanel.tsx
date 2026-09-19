import { useEffect, useState } from "react";
import type { CandidateSession, SessionState } from "@shared/types";
import { formatDuration } from "../lib/clock";

const STATE_LABEL: Record<SessionState, string> = {
  active: "Active",
  frozen: "Frozen",
  resumed: "Resumed",
  submitted: "Complete",
};

const STATE_BADGE_CLASS: Record<SessionState, string> = {
  active: "state-badge state-badge--good",
  frozen: "state-badge state-badge--bad",
  resumed: "state-badge state-badge--caution",
  submitted: "state-badge state-badge--good",
};

function SessionClock({
  remainingMs,
  serverNow,
}: {
  remainingMs: number;
  serverNow: number;
}) {
  const [display, setDisplay] = useState(remainingMs);

  useEffect(() => {
    // Snap to the server value whenever a new one arrives (architecture.md
    // §5 — the UI never owns the clock; it only extrapolates a smooth
    // countdown between pushes and snaps on every new remainingMs/serverNow
    // pair, which is what this effect's dependency array does).
    setDisplay(remainingMs);
    const id = setInterval(() => {
      setDisplay((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [remainingMs, serverNow]);

  return (
    <div className="candidate-card__clock" aria-live="off">
      {formatDuration(display)}
    </div>
  );
}

function SessionBanner({ session }: { session: CandidateSession }) {
  if (session.state === "frozen") {
    return (
      <div className="candidate-card__banner candidate-card__banner--frozen">
        Center disrupted. Your progress is saved. Timer paused. Do not refresh.
      </div>
    );
  }
  if (session.state === "resumed") {
    return (
      <>
        <div className="candidate-card__banner candidate-card__banner--resuming">
          Reconnected. Resuming your timer...
        </div>
        {session.frozenMsTotal > 0 ? (
          <span className="candidate-card__delta">
            +{Math.round(session.frozenMsTotal / 1000)}s restored
          </span>
        ) : null}
      </>
    );
  }
  return null;
}

export function CandidatePanel({ sessions }: { sessions: CandidateSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="panel">
        <p className="panel__header">Candidate Sessions</p>
        <p className="panel__empty">No sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <p className="panel__header">Candidate Sessions</p>
      <div className="candidate-list">
        {sessions.map((session) => (
          <div className="candidate-card" key={session.id}>
            <div className="candidate-card__head">
              <div>
                <div className="candidate-card__name">{session.candidateName}</div>
                <div className="candidate-card__roll">Roll no. {session.rollNo}</div>
              </div>
              <span
                className={STATE_BADGE_CLASS[session.state]}
                aria-live="polite"
              >
                {STATE_LABEL[session.state]}
              </span>
            </div>
            <SessionClock
              remainingMs={session.remainingMs}
              serverNow={session.serverNow}
            />
            <div className="candidate-card__meta-row">
              Question {session.currentQuestionIdx + 1} · Last answer saved:{" "}
              {session.lastAnswer ?? "—"}
            </div>
            <SessionBanner session={session} />
          </div>
        ))}
      </div>
    </div>
  );
}
