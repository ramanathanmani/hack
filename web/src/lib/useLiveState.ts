/**
 * lib/useLiveState.ts — WS subscribe with auto-degrade to 2s polling of
 * GET /api/state (architecture.md §3/§8/§11 risk 3). Because every WS
 * event's payload is a subset of ApiState's shape, both the push path and
 * the poll path converge on the same reducer (`applyEvent` /
 * `state.snapshot` handling), so the degraded mode is not a second code
 * path that can rot.
 */
import { useEffect, useReducer, useRef, useState, useCallback } from "react";
import type { ApiState, ConnectionMode, WsEvent } from "@shared/types";
import { getState, ApiError } from "./api";

const POLL_INTERVAL_MS = 2000;
const WS_CONNECT_TIMEOUT_MS = 3000;

type Action =
  | { kind: "snapshot"; state: ApiState }
  | { kind: "event"; event: WsEvent };

function upsertBy<T, K>(list: T[], item: T, key: (x: T) => K): T[] {
  const itemKey = key(item);
  const idx = list.findIndex((x) => key(x) === itemKey);
  if (idx === -1) return [...list, item];
  const next = list.slice();
  next[idx] = item;
  return next;
}

function reducer(state: ApiState | null, action: Action): ApiState | null {
  if (action.kind === "snapshot") {
    return action.state;
  }
  if (!state) {
    // No base state yet — an event without a snapshot can't be applied
    // meaningfully; ignore until the next state.snapshot/hydrate lands.
    return state;
  }
  const { event } = action;
  switch (event.type) {
    case "center.updated":
      return {
        ...state,
        centers: upsertBy(state.centers, event.payload, (c) => c.id),
      };
    case "session.updated":
      return {
        ...state,
        sessions: upsertBy(state.sessions, event.payload, (s) => s.id),
      };
    case "incident.opened":
    case "incident.updated":
      return {
        ...state,
        incidents: upsertBy(state.incidents, event.payload, (i) => i.id),
      };
    case "checkpoint.appended": {
      const recentCheckpoints = [event.payload, ...state.recentCheckpoints];
      // Keep a bounded tail so the ledger panel doesn't grow unbounded
      // across a long-running demo session.
      recentCheckpoints.length = Math.min(recentCheckpoints.length, 200);
      return { ...state, recentCheckpoints };
    }
    case "verdict.computed":
      return {
        ...state,
        verdicts: upsertBy(state.verdicts, event.payload, (v) => v.incidentId),
      };
    case "sim.reset":
    case "state.snapshot":
      return event.payload;
    default:
      return state;
  }
}

export interface LiveState {
  state: ApiState | null;
  connection: ConnectionMode;
  offlineSinceMs: number | null;
  error: string | null;
  retry: () => void;
}

export function useLiveState(): LiveState {
  const [state, dispatch] = useReducer(reducer, null);
  const [connection, setConnection] = useState<ConnectionMode>("offline");
  const [error, setError] = useState<string | null>(null);
  const [offlineSinceMs, setOfflineSinceMs] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  const clearPoll = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    clearPoll();
    setConnection((prev) => (prev === "live" ? prev : "polling"));
    const tick = async () => {
      try {
        const snapshot = await getState();
        dispatch({ kind: "snapshot", state: snapshot });
        setError(null);
        setOfflineSinceMs(null);
        setConnection((prev) => (prev === "live" ? prev : "polling"));
      } catch (err) {
        setConnection("offline");
        setOfflineSinceMs((prev) => prev ?? Date.now());
        setError(err instanceof ApiError ? err.message : "Network error");
      }
    };
    void tick();
    pollRef.current = setInterval(tick, POLL_INTERVAL_MS);
  }, [clearPoll]);

  const connectWs = useCallback(() => {
    const myAttempt = ++attemptRef.current;
    let settled = false;

    let ws: WebSocket;
    try {
      const proto = window.location.protocol === "https:" ? "wss://" : "ws://";
      ws = new WebSocket(`${proto}${window.location.host}/ws`);
    } catch {
      startPolling();
      return;
    }
    wsRef.current = ws;

    wsTimeoutRef.current = setTimeout(() => {
      if (!settled && attemptRef.current === myAttempt) {
        settled = true;
        ws.close();
        startPolling();
      }
    }, WS_CONNECT_TIMEOUT_MS);

    ws.addEventListener("open", () => {
      if (attemptRef.current !== myAttempt) return;
      settled = true;
      if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
      clearPoll();
      setConnection("live");
      setError(null);
      setOfflineSinceMs(null);
    });

    ws.addEventListener("message", (msg) => {
      if (attemptRef.current !== myAttempt) return;
      try {
        const parsed = JSON.parse(String(msg.data)) as WsEvent;
        dispatch({ kind: "event", event: parsed });
      } catch {
        // Ignore malformed frames — the next snapshot/poll will correct state.
      }
    });

    const onDown = () => {
      if (attemptRef.current !== myAttempt) return;
      if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
      startPolling();
    };
    ws.addEventListener("close", onDown);
    ws.addEventListener("error", onDown);
  }, [clearPoll, startPolling]);

  const retry = useCallback(() => {
    setError(null);
    connectWs();
  }, [connectWs]);

  useEffect(() => {
    // Hydrate immediately from GET /api/state on mount (design.md: hydrate
    // on mount, poll fallback is trivial because shapes match).
    getState()
      .then((snapshot) => {
        dispatch({ kind: "snapshot", state: snapshot });
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Network error");
        setOfflineSinceMs((prev) => prev ?? Date.now());
      });

    connectWs();

    return () => {
      attemptRef.current++;
      if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
      wsRef.current?.close();
      clearPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, connection, offlineSinceMs, error, retry };
}
