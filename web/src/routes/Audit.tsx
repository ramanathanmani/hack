import { useCallback, useState } from "react";
import type { ChainVerifyResult } from "@shared/types";
import { useLiveState } from "../lib/useLiveState";
import { FramingHeader } from "../components/FramingHeader";
import { Link } from "../router";
import { verifyChain, tamperChain, ApiError } from "../lib/api";

type BannerStatus = "neutral" | "verifying" | "pass" | "fail" | "error";

interface BannerState {
  status: BannerStatus;
  result?: ChainVerifyResult;
  verifiedAt?: number;
  rowsChecked?: number;
  errorMessage?: string;
}

const OFFLINE_RETRY_DELAY_MS = 3000;

export function Audit() {
  const { state, connection, offlineSinceMs, retry } = useLiveState();
  const [banner, setBanner] = useState<BannerState>({ status: "neutral" });
  const [tamperBusy, setTamperBusy] = useState(false);
  const [tamperNote, setTamperNote] = useState<string | null>(null);

  const totalCheckpoints = state?.recentCheckpoints.length ?? 0;

  const handleVerify = useCallback(async () => {
    setBanner({ status: "verifying" });
    try {
      const result = await verifyChain();
      setBanner({
        status: result.ok ? "pass" : "fail",
        result,
        verifiedAt: Date.now(),
        rowsChecked: totalCheckpoints,
      });
    } catch (err) {
      setBanner({
        status: "error",
        errorMessage: err instanceof ApiError ? err.message : "Could not reach server.",
      });
    }
  }, [totalCheckpoints]);

  const handleTamper = useCallback(async () => {
    setTamperBusy(true);
    try {
      await tamperChain();
      setTamperNote("Tamper applied. Verify again to see it detected.");
    } catch (err) {
      setTamperNote(err instanceof ApiError ? err.message : "Tamper request failed.");
    } finally {
      setTamperBusy(false);
    }
  }, []);

  const showOfflineRetry =
    connection === "offline" &&
    offlineSinceMs !== null &&
    Date.now() - offlineSinceMs > OFFLINE_RETRY_DELAY_MS;

  return (
    <div className="app-shell">
      <FramingHeader
        centers={state?.centers.length ?? 0}
        sessions={state?.sessions.length ?? 0}
        incidents={state?.incidents.length ?? 0}
        connection={connection}
        showRetry={showOfflineRetry}
        onRetry={retry}
        currentPath="/audit"
      />
      <main className="main-content">
        <Link to="/" className="back-link">
          ← Back to Control Tower
        </Link>
        <h1 className="page-headline">Chain Integrity</h1>
        <p className="page-subhead">
          Every checkpoint is hash-linked. Verify the whole chain in one click.
        </p>

        <VerifyBanner banner={banner} />

        <div className="audit-actions">
          <button
            type="button"
            className="btn btn--large"
            onClick={handleVerify}
            disabled={banner.status === "verifying"}
          >
            Verify Chain Integrity
          </button>
        </div>

        <section className="simulator-controls" aria-label="Simulator controls">
          <p className="simulator-controls__header">
            SIMULATOR CONTROLS — not part of the production system
          </p>
          <div className="simulator-controls__field">
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleTamper}
              disabled={tamperBusy}
            >
              Tamper (simulator)
            </button>
            <p className="simulator-controls__helper">
              Corrupts one stored hash to demonstrate detection. Simulator only — not a real
              attack path.
            </p>
            {tamperNote ? (
              <p className="simulator-controls__helper" role="status" aria-live="polite">
                {tamperNote}
              </p>
            ) : null}
          </div>
        </section>

        <hr className="simulator-controls__divider" style={{ borderTop: "1px solid var(--color-border)" }} />

        <ChainTable checkpoints={state?.recentCheckpoints ?? []} brokenSeq={brokenSeqOf(banner)} />
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ verticalAlign: "-6px" }}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ verticalAlign: "-6px" }}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function brokenSeqOf(banner: BannerState): { centerId: string; seq: number } | null {
  if (banner.status === "fail" && banner.result && banner.result.ok === false) {
    return { centerId: banner.result.brokenAt.centerId, seq: banner.result.brokenAt.seq };
  }
  return null;
}

function VerifyBanner({ banner }: { banner: BannerState }) {
  if (banner.status === "neutral") {
    return (
      <div className="verify-banner verify-banner--neutral" role="status" aria-live="polite">
        <p className="verify-banner__title">Not Yet Verified</p>
      </div>
    );
  }
  if (banner.status === "verifying") {
    return (
      <div className="verify-banner verify-banner--neutral" role="status" aria-live="polite">
        <p className="verify-banner__title">Recomputing hashes...</p>
      </div>
    );
  }
  if (banner.status === "error") {
    return (
      <div className="verify-banner verify-banner--error" role="alert" aria-live="assertive">
        <p className="verify-banner__title">Could not reach server. Try again.</p>
      </div>
    );
  }
  if (banner.status === "pass") {
    return (
      <div className="verify-banner verify-banner--pass" role="status" aria-live="assertive">
        <p className="verify-banner__title">
          <CheckIcon /> Chain Verified — PASS
        </p>
        <p className="verify-banner__detail">
          {banner.rowsChecked ?? 0} rows checked · verified at{" "}
          {new Date(banner.verifiedAt ?? Date.now()).toLocaleTimeString()}
        </p>
      </div>
    );
  }
  // fail
  const broken =
    banner.result && banner.result.ok === false ? banner.result.brokenAt : null;
  return (
    <div className="verify-banner verify-banner--fail" role="alert" aria-live="assertive">
      <p className="verify-banner__title">
        <CrossIcon /> Tamper Detected — FAIL
      </p>
      {broken ? (
        <p className="verify-banner__detail mono">
          Row broken: center {broken.centerId}, seq {broken.seq} — expected `
          {broken.expectedHash}`, found `{broken.actualHash}`
        </p>
      ) : null}
    </div>
  );
}

function ChainTable({
  checkpoints,
  brokenSeq,
}: {
  checkpoints: import("@shared/types").Checkpoint[];
  brokenSeq: { centerId: string; seq: number } | null;
}) {
  return (
    <div className="panel">
      <p className="panel__header">Full Chain</p>
      {checkpoints.length === 0 ? (
        <p className="panel__empty">No checkpoints yet.</p>
      ) : (
        <table className="ledger-table">
          <caption className="visually-hidden">Full checkpoint chain across all centers</caption>
          <thead>
            <tr>
              <th scope="col">Center</th>
              <th scope="col">Seq</th>
              <th scope="col">Kind</th>
              <th scope="col">Hash</th>
              <th scope="col">Prev Hash</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {checkpoints.map((cp) => {
              const isBroken =
                brokenSeq && brokenSeq.centerId === cp.centerId && brokenSeq.seq === cp.seq;
              return (
                <tr
                  key={cp.id}
                  style={isBroken ? { background: "var(--color-bad-bg)" } : undefined}
                >
                  <td>{cp.centerId}</td>
                  <td>{cp.seq}</td>
                  <td>{cp.kind}</td>
                  <td className="hash-cell mono" title={cp.hash}>
                    {cp.hash.slice(0, 10)}…
                  </td>
                  <td className="hash-cell mono" title={cp.prevHash}>
                    {cp.prevHash.slice(0, 10)}…
                  </td>
                  <td>
                    {isBroken ? (
                      <span className="state-badge state-badge--bad">Broken</span>
                    ) : (
                      <span className="state-badge state-badge--good">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
