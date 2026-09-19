/**
 * routes/sim.ts — the simulator control surface: kill switch, reconnect,
 * reset (AC-2, AC-5, AC-12). Gated behind ENABLE_SIM_CONTROLS the same way
 * the whole /api/sim prefix is (architecture.md §7): in production this
 * prefix is not mounted / the operator console sits behind SSO.
 */

import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo.js";
import type { Simulator } from "../sim/simulator.js";
import { config } from "../config.js";

export function registerSimRoutes(app: FastifyInstance, repo: Repo, simulator: Simulator): void {
  // P2-7: the check used to live in a root-scoped app.addHook("preHandler"),
  // which gated EVERY route on the Fastify instance (including GET / and
  // /api/state), not just /api/sim/*, and didn't `return reply.send(...)` so
  // Fastify treated it as a continuation rather than a stop. Checking inside
  // each handler (matching routes/audit.ts) scopes the gate correctly.
  app.post<{ Params: { centerId: string } }>("/api/sim/kill/:centerId", async (req, reply) => {
    if (!config.enableSimControls) {
      return reply.code(403).send({ error: "sim_controls_disabled" });
    }
    const center = repo.getCenter(req.params.centerId);
    if (!center)
      return reply.code(404).send({ error: "not_found", message: `center ${req.params.centerId} not found` });
    simulator.kill(req.params.centerId);
    return { ok: true, centerId: req.params.centerId, action: "kill" };
  });

  app.post<{ Params: { centerId: string } }>("/api/sim/reconnect/:centerId", async (req, reply) => {
    if (!config.enableSimControls) {
      return reply.code(403).send({ error: "sim_controls_disabled" });
    }
    const center = repo.getCenter(req.params.centerId);
    if (!center)
      return reply.code(404).send({ error: "not_found", message: `center ${req.params.centerId} not found` });
    simulator.reconnect(req.params.centerId);
    return { ok: true, centerId: req.params.centerId, action: "reconnect" };
  });

  app.post("/api/sim/reset", async (_req, reply) => {
    if (!config.enableSimControls) {
      return reply.code(403).send({ error: "sim_controls_disabled" });
    }
    simulator.reset();
    return { ok: true, action: "reset" };
  });
}
