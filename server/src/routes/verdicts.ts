/**
 * routes/verdicts.ts — GET /api/verdicts/:incidentId.
 */

import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo.js";

export function registerVerdictRoutes(app: FastifyInstance, repo: Repo): void {
  app.get<{ Params: { incidentId: string } }>("/api/verdicts/:incidentId", async (req, reply) => {
    const incident = repo.getIncident(req.params.incidentId);
    if (!incident)
      return reply
        .code(404)
        .send({ error: "not_found", message: `incident ${req.params.incidentId} not found` });
    const verdicts = repo.getVerdictsByIncident(req.params.incidentId);
    return verdicts;
  });
}
