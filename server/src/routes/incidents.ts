/**
 * routes/incidents.ts — GET /api/incidents, GET /api/incidents/:id.
 */

import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo.js";

export function registerIncidentRoutes(app: FastifyInstance, repo: Repo): void {
  app.get("/api/incidents", async () => {
    return repo.listIncidents();
  });

  app.get<{ Params: { id: string } }>("/api/incidents/:id", async (req, reply) => {
    const incident = repo.getIncident(req.params.id);
    if (!incident)
      return reply.code(404).send({ error: "not_found", message: `incident ${req.params.id} not found` });
    return incident;
  });
}
