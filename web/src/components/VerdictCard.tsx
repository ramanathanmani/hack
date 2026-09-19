import type { Verdict, VerdictDecision } from "@shared/types";

const DECISION_LABEL: Record<VerdictDecision, string> = {
  "re-conduct": "Re-Conduct Required",
  "partial-extension": "Partial Time Extension",
  "no-action": "No Action Needed",
};

const DECISION_CLASS: Record<VerdictDecision, string> = {
  "re-conduct": "verdict-card__decision verdict-card__decision--bad",
  "partial-extension": "verdict-card__decision verdict-card__decision--caution",
  "no-action": "verdict-card__decision verdict-card__decision--good",
};

const INPUT_LABELS: Array<{ key: string; label: string }> = [
  { key: "affected_candidates", label: "Sessions Affected" },
  { key: "avg_frozen_ms", label: "Average Frozen Time" },
  { key: "max_frozen_ms", label: "Max Frozen Time" },
  { key: "checkpoints_lost", label: "Checkpoints Lost" },
];

function formatMsInput(key: string, value: number): string {
  if (key.endsWith("_ms")) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  return String(value);
}

export function VerdictCard({
  verdict,
  incidentResolved,
}: {
  verdict: Verdict | null;
  incidentResolved: boolean;
}) {
  if (!verdict) {
    return (
      <div className="verdict-card">
        <p className="panel__empty">
          {incidentResolved
            ? "Verdict not yet available."
            : "Verdict computes automatically once the incident resolves."}
        </p>
      </div>
    );
  }

  const { reasoning } = verdict;

  return (
    <div className="verdict-card">
      <p className={DECISION_CLASS[verdict.decision]}>
        {DECISION_LABEL[verdict.decision]}
      </p>

      <p className="verdict-card__section-header">Rule Applied</p>
      <p className="verdict-card__rule mono">{reasoning.rule}</p>

      <p className="verdict-card__section-header">Inputs</p>
      <dl className="verdict-card__inputs">
        {INPUT_LABELS.map(({ key, label }) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd className="mono">
              {formatMsInput(key, reasoning.inputs[key] ?? 0)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="verdict-card__section-header">How We Got Here</p>
      <ul className="verdict-card__arithmetic">
        {reasoning.arithmetic.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      <p className="verdict-card__footnote">
        Illustrative cost avoided (not a guarantee)
      </p>
      <p className="verdict-card__cost-line">
        Estimated re-conduct cost avoided: ~₹
        {reasoning.cost_avoided.total_inr.toLocaleString("en-IN")} (illustrative)
      </p>
    </div>
  );
}

export function VerdictCardSkeleton() {
  return <div className="verdict-card skeleton" style={{ height: 220 }} aria-hidden="true" />;
}
