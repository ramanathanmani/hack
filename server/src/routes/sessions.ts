/**
 * routes/sessions.ts — GET /api/sessions/:id, GET /api/sessions/:id/checkpoints.
 */

import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo.js";

export function registerSessionRoutes(app: FastifyInstance, repo: Repo): void {
  app.get<{ Params: { id: string } }>("/api/sessions/:id", async (req, reply) => {
    const session = repo.getSession(req.params.id, Date.now());
    if (!session)
      return reply.code(404).send({ error: "not_found", message: `session ${req.params.id} not found` });
    return session;
  });

  app.get<{ Params: { id: string } }>("/api/sessions/:id/checkpoints", async (req, reply) => {
    const session = repo.getSession(req.params.id, Date.now());
    if (!session)
      return reply.code(404).send({ error: "not_found", message: `session ${req.params.id} not found` });
    return repo.getCheckpointsBySession(req.params.id);
  });
}
