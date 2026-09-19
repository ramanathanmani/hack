import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveState } from "../lib/useLiveState";
import { FramingHeader } from "../components/FramingHeader";
import { CenterGrid, CenterGridSkeleton } from "../components/CenterGrid";
import { CandidatePanel } from "../components/CandidatePanel";
import { LedgerPanel } from "../components/LedgerPanel";
import { VerdictCard, VerdictCardSkeleton } from "../components/VerdictCard";
import { SimulatorControls } from "../components/SimulatorControls";
import { SimulatedBadge } from "../components/SimulatedBadge";
import { killCenter, reconnectCenter, resetSim, ApiError } from "../lib/api";

const OFFLINE_RETRY_DELAY_MS = 3000;

export function ControlTower() {
  const { state, connection, offlineSinceMs, retry } = useLiveState();
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auto-select the first center once state hydrates, so the golden path
  // (M1 single-center) doesn't require an extra click.
  useEffect(() => {
    if (!selectedCenterId && state && state.centers.length > 0) {
      setSelectedCenterId(state.centers[0].id);
    }
  }, [state, selectedCenterId]);

  const selectedCenter = useMemo(
    () => state?.centers.find((c) => c.id === selectedCenterId) ?? null,
    [state, selectedCenterId],
  );

  const centerSessions = useMemo(
    () =>
      state && selectedCenterId
        ? state.sessions.filter((s) => s.centerId === selectedCenterId)
        : [],
    [state, selectedCenterId],
  );

  const centerCheckpoints = useMemo(
    () =>
      state && selectedCenterId
        ? state.recentCheckpoints.filter((c) => c.centerId === selectedCenterId)
        : [],
    [state, selectedCenterId],
  );

  const openIncident = useMemo(
    () =>
      state && selectedCenterId
        ? state.incidents.find(
            (i) => i.centerId === selectedCenterId && i.status !== "resolved",
          ) ?? null
        : null,
    [state, selectedCenterId],
  );

  const latestIncident = useMemo(
    () =>
      state && selectedCenterId
        ? state.incidents
            .filter((i) => i.centerId === selectedCenterId)
            .sort((a, b) => b.openedAt - a.openedAt)[0] ?? null
        : null,
    [state, selectedCenterId],
  );

  const verdictForIncident = useMemo(
    () =>
      state && latestIncident
        ? state.verdicts.find((v) => v.incidentId === latestIncident.id) ?? null
        : null,
    [state, latestIncident],
  );

  const handleKill = useCallback(async () => {
    if (!selectedCenterId) return;
    setBusy(true);
    setActionError(null);
    try {
      await killCenter(selectedCenterId);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Kill Switch failed");
    } finally {
      setBusy(false);
    }
  }, [selectedCenterId]);

  const handleReconnect = useCallback(async () => {
    if (!selectedCenterId) return;
    setBusy(true);
    setActionError(null);
    try {
      await reconnectCenter(selectedCenterId);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Reconnect failed");
    } finally {
      setBusy(false);
    }
  }, [selectedCenterId]);

  const handleReset = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    try {
      await resetSim();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const showOfflineRetry =
    connection === "offline" &&
    offlineSinceMs !== null &&
    Date.now() - offlineSinceMs > OFFLINE_RETRY_DELAY_MS;

  const isLoading = state === null && connection !== "offline";
  const isEmpty = state !== null && state.centers.length === 0;

  return (
    <div className="app-shell">
      <FramingHeader
        centers={state?.centers.length ?? 0}
        sessions={state?.sessions.length ?? 0}
        incidents={state?.incidents.length ?? 0}
        connection={connection}
        showRetry={showOfflineRetry}
        onRetry={retry}
        currentPath="/"
      />
      <main className="main-content">
        <h1 className="page-headline">Control Tower</h1>
        <p className="page-subhead">Every exam center, watched in real time.</p>

        {isEmpty ? (
          <div className="panel">
            <p className="panel__empty">
              No exam data yet. Run `npm run seed` to start the demo.
            </p>
          </div>
        ) : (
          <>
            {openIncident ? (
              <div className="escalation-banner" role="status" aria-live="assertive">
                <p className="escalation-banner__headline">
                  Center Disrupted — {selectedCenter?.name ?? openIncident.centerId}
                </p>
                <p className="escalation-banner__detail">
                  {openIncident.classification} · Severity:{" "}
                  {openIncident.severity[0].toUpperCase() + openIncident.severity.slice(1)} ·{" "}
                  {openIncident.affectedCount} sessions frozen
                </p>
              </div>
            ) : null}

            {actionError ? (
              <div className="escalation-banner escalation-banner--neutral" role="alert">
                <p className="escalation-banner__detail">{actionError}</p>
              </div>
            ) : null}

            <div className="tower-layout">
              <div className="tower-layout__left">
                <div className="badge-row">
                  <SimulatedBadge />
                </div>
                {isLoading ? (
                  <CenterGridSkeleton />
                ) : (
                  <CenterGrid
                    centers={state?.centers ?? []}
                    selectedCenterId={selectedCenterId}
                    onSelect={setSelectedCenterId}
                  />
                )}

                <SimulatorControls
                  centers={state?.centers ?? []}
                  selectedCenterId={selectedCenterId}
                  onSelectCenter={setSelectedCenterId}
                  onKill={handleKill}
                  onReconnect={handleReconnect}
                  onReset={handleReset}
                  busy={busy}
                />

                {latestIncident ? (
                  <div className="panel">
                    <p className="panel__header">Verdict</p>
                    {isLoading ? (
                      <VerdictCardSkeleton />
                    ) : (
                      <VerdictCard
                        verdict={verdictForIncident}
                        incidentResolved={latestIncident.status === "resolved"}
                      />
                    )}
                  </div>
                ) : null}
              </div>

              <div className="tower-layout__right">
                <CandidatePanel sessions={centerSessions} />
                <LedgerPanel checkpoints={centerCheckpoints} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
