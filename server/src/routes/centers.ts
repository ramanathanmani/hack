/**
 * routes/centers.ts — GET /api/centers, GET /api/centers/:id (drill-down;
 * the Control Tower itself hydrates from GET /api/state).
 */

import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo.js";

export function registerCenterRoutes(app: FastifyInstance, repo: Repo): void {
  app.get("/api/centers", async () => {
    return repo.listCenters();
  });

  app.get<{ Params: { id: string } }>("/api/centers/:id", async (req, reply) => {
    const center = repo.getCenter(req.params.id);
    if (!center) return reply.code(404).send({ error: "not_found", message: `center ${req.params.id} not found` });
    return center;
  });
}
