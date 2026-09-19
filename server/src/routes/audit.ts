/**
 * routes/audit.ts — POST /api/audit/verify (AC-7/AC-8) and POST /api/sim/tamper
 * (A2 — raw UPDATE bypassing the append-only API, on purpose, gated the same
 * as the rest of /api/sim by ENABLE_SIM_CONTROLS).
 */

import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo.js";
import { config } from "../config.js";
import type { BroadcastFn } from "../sim/simulator.js";

export function registerAuditRoutes(app: FastifyInstance, repo: Repo, broadcast: BroadcastFn): void {
  app.post("/api/audit/verify", async () => {
    return repo.verifyLedger();
  });

  app.post("/api/sim/tamper", async (req, reply) => {
    if (!config.enableSimControls) {
      return reply.code(403).send({ error: "sim_controls_disabled" });
    }
    const target = repo.pickTamperTarget();
    if (!target) {
      return reply.code(409).send({ error: "no_checkpoints", message: "nothing to tamper with yet" });
    }
    let payload: unknown;
    try {
      payload = JSON.parse(target.payloadJson);
    } catch {
      payload = {};
    }
    const tamperedPayload =
      payload && typeof payload === "object"
        ? { ...(payload as Record<string, unknown>), answer: "TAMPERED", tamperedAt: Date.now() }
        : { tamperedAt: Date.now() };
    const tampered = repo.tamperCheckpoint(target.id, tamperedPayload);
    broadcast({ type: "checkpoint.appended", payload: tampered! });
    return { tampered: true, checkpointId: target.id, centerId: target.centerId, seq: target.seq };
  });
}
