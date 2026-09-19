/**
 * lib/api.ts — typed fetch wrappers over the real backend contract in
 * @shared/types. Same-origin requests only (dev: Vite proxy → :8080; prod:
 * one process serves both). No external network calls (AC-14).
 *
 * The backend (server/**) is built in parallel by backend-builder; these
 * routes are named per architecture.md §3 route map. If a route is not yet
 * implemented, callers see a rejected promise and the UI's error/offline
 * states (ConnectionPill, banners) handle it — no client-side mocking of
 * data, per the "wire to real backend" instruction.
 */
import type { ApiState, ChainVerifyResult, Verdict } from "@shared/types";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network request failed",
    );
  }
  if (!res.ok) {
    throw new ApiError(`${path} → HTTP ${res.status}`, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function getState(): Promise<ApiState> {
  return request<ApiState>("/api/state");
}

export function killCenter(centerId: string): Promise<void> {
  return request<void>(`/api/sim/kill/${encodeURIComponent(centerId)}`, {
    method: "POST",
  });
}

export function reconnectCenter(centerId: string): Promise<void> {
  return request<void>(`/api/sim/reconnect/${encodeURIComponent(centerId)}`, {
    method: "POST",
  });
}

export function resetSim(): Promise<void> {
  return request<void>("/api/sim/reset", { method: "POST" });
}

export function verifyChain(): Promise<ChainVerifyResult> {
  return request<ChainVerifyResult>("/api/audit/verify", { method: "POST" });
}

// Response shape of the tamper route is not part of shared/types.ts (it's an
// internal debug/demo detail per architecture.md §13). Kept loose here on
// purpose — the FAIL detail the UI shows comes from the next verifyChain()
// call's ChainVerifyBroken payload, not from this response.
export function tamperChain(): Promise<unknown> {
  return request<unknown>("/api/sim/tamper", { method: "POST" });
}

export function getVerdict(incidentId: string): Promise<Verdict> {
  return request<Verdict>(`/api/verdicts/${encodeURIComponent(incidentId)}`);
}

export { ApiError };
