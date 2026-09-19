/**
 * SimulatedBadge — AC-13. Attached to any element whose underlying data
 * originates from the simulator, so the "source is simulated, everything
 * downstream is real" claim (architecture.md §13) is visible on screen.
 */
export function SimulatedBadge() {
  return (
    <span className="simulated-badge">
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="4" fill="currentColor" />
      </svg>
      Simulated telemetry
    </span>
  );
}
