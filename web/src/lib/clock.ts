/**
 * lib/clock.ts — display-only clock formatting. The UI never computes the
 * exam clock (architecture.md §5: server is authoritative for remainingMs /
 * serverNow); this module only formats a millisecond value for display and
 * extrapolates the *display* between server pushes, snapping to the server
 * value on every new message per the same rule.
 */

export function formatDuration(ms: number): string {
  const clamped = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
