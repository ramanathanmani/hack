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
  app.addHook("preHandler", async (req, reply) => {
    if (!config.enableSimControls) {
      reply.code(403).send({ error: "sim_controls_disabled" });
    }
  });

  app.post<{ Params: { centerId: string } }>("/api/sim/kill/:centerId", async (req, reply) => {
    const center = repo.getCenter(req.params.centerId);
    if (!center)
      return reply.code(404).send({ error: "not_found", message: `center ${req.params.centerId} not found` });
    simulator.kill(req.params.centerId);
    return { ok: true, centerId: req.params.centerId, action: "kill" };
  });

  app.post<{ Params: { centerId: string } }>("/api/sim/reconnect/:centerId", async (req, reply) => {
    const center = repo.getCenter(req.params.centerId);
    if (!center)
      return reply.code(404).send({ error: "not_found", message: `center ${req.params.centerId} not found` });
    simulator.reconnect(req.params.centerId);
    return { ok: true, centerId: req.params.centerId, action: "reconnect" };
  });

  app.post("/api/sim/reset", async () => {
    simulator.reset();
    return { ok: true, action: "reset" };
  });
}
