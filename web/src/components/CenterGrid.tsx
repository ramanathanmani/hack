import type { Center, CenterStatus } from "@shared/types";

const STATUS_LABEL: Record<CenterStatus, string> = {
  healthy: "Healthy",
  degraded: "Recovering",
  down: "Down",
};

const STATUS_DOT_CLASS: Record<CenterStatus, string> = {
  healthy: "status-dot status-dot--good",
  degraded: "status-dot status-dot--caution",
  down: "status-dot status-dot--bad",
};

export function CenterGrid({
  centers,
  selectedCenterId,
  onSelect,
}: {
  centers: Center[];
  selectedCenterId: string | null;
  onSelect: (centerId: string) => void;
}) {
  if (centers.length === 0) {
    return (
      <div className="panel">
        <p className="panel__header">Centers</p>
        <p className="panel__empty">No exam data yet. Run `npm run seed` to start the demo.</p>
      </div>
    );
  }

  return (
    <div className="center-grid" role="list" aria-label="Exam centers">
      {centers.map((center) => (
        <button
          key={center.id}
          type="button"
          role="listitem"
          className="center-card"
          aria-pressed={center.id === selectedCenterId}
          onClick={() => onSelect(center.id)}
        >
          <span className="center-card__name">{center.name}</span>
          <span className="center-card__status">
            <span
              className={STATUS_DOT_CLASS[center.status]}
              aria-hidden="true"
            />
            {STATUS_LABEL[center.status]}
          </span>
          <span className="center-card__meta">
            Risk score: {center.riskScore} · {center.candidateCnt} candidates
          </span>
        </button>
      ))}
    </div>
  );
}

export function CenterGridSkeleton() {
  return (
    <div className="center-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}
