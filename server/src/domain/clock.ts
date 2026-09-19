/**
 * domain/clock.ts — the ONE authoritative exam clock (architecture.md §5).
 * The server includes `remaining_ms` + `server_now` in every session
 * payload; the UI never computes exam time itself. This is what makes AC-5
 * ("remaining time visibly increases at the moment of resume") deterministic.
 *
 *   elapsed   = (state === 'frozen' ? frozen_at : now) - exam_started_at
 *   remaining = exam_duration_ms - (elapsed - frozen_ms_total)
 *
 * On freeze: frozen_at = now.
 * On resume: frozen_ms_total += now - frozen_at; frozen_at = null;
 *            state = 'resumed'.
 */

export interface ClockInput {
  state: string;
  examStartedAt: number;
  examDurationMs: number;
  frozenAt: number | null;
  frozenMsTotal: number;
}

export function remainingMs(session: ClockInput, now: number): number {
  const elapsed =
    (session.state === "frozen" && session.frozenAt !== null ? session.frozenAt : now) -
    session.examStartedAt;
  return session.examDurationMs - (elapsed - session.frozenMsTotal);
}

/** Fields to persist when a session freezes at `now`. */
export function freezeFields(now: number): { frozenAt: number; state: "frozen" } {
  return { frozenAt: now, state: "frozen" };
}

/**
 * Fields to persist when a frozen session resumes at `now`. Requires the
 * session's current `frozenAt` (must be non-null — caller's responsibility
 * to only call this on frozen sessions).
 */
export function resumeFields(
  session: Pick<ClockInput, "frozenAt" | "frozenMsTotal">,
  now: number
): { frozenMsTotal: number; frozenAt: null; state: "resumed" } {
  const addedMs = session.frozenAt !== null ? now - session.frozenAt : 0;
  return {
    frozenMsTotal: session.frozenMsTotal + addedMs,
    frozenAt: null,
    state: "resumed",
  };
}
