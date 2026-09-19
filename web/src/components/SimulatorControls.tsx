import type { Center } from "@shared/types";

export function SimulatorControls({
  centers,
  selectedCenterId,
  onSelectCenter,
  onKill,
  onReconnect,
  onReset,
  busy,
}: {
  centers: Center[];
  selectedCenterId: string | null;
  onSelectCenter: (centerId: string) => void;
  onKill: () => void;
  onReconnect: () => void;
  onReset?: () => void;
  busy?: boolean;
}) {
  const selected = centers.find((c) => c.id === selectedCenterId) ?? null;
  const canReconnect = selected?.status === "down";

  return (
    <section className="simulator-controls" aria-label="Simulator controls">
      <p className="simulator-controls__header">
        SIMULATOR CONTROLS — not part of the production system
      </p>

      <div className="simulator-controls__row">
        <div className="simulator-controls__field">
          <label htmlFor="sim-center-picker">Choose a center to disrupt</label>
          <select
            id="sim-center-picker"
            className="select"
            value={selectedCenterId ?? ""}
            onChange={(e) => onSelectCenter(e.target.value)}
          >
            <option value="" disabled>
              Select a center
            </option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="simulator-controls__row">
        <div className="simulator-controls__field">
          <button
            type="button"
            className="btn btn--danger"
            onClick={onKill}
            disabled={busy || !selectedCenterId || selected?.status === "down"}
          >
            Kill Switch
          </button>
          <p className="simulator-controls__helper">
            Cuts connectivity to the selected center.
          </p>
        </div>

        <div className="simulator-controls__field">
          <button
            type="button"
            className="btn"
            onClick={onReconnect}
            disabled={busy || !canReconnect}
          >
            Reconnect
          </button>
          <p className="simulator-controls__helper">
            Restores connectivity and resumes frozen sessions.
          </p>
        </div>

        {onReset ? (
          <div className="simulator-controls__field">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onReset}
              disabled={busy}
            >
              Reset Demo
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
