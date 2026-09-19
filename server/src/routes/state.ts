/**
 * routes/state.ts — GET /api/state, the aggregate hydrate-everything
 * endpoint (Spec B §6 / decision.md §4 M5, architecture decision #2). Every
 * WS event payload is a subset of this shape.
 */

import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo.js";

export function registerStateRoutes(app: FastifyInstance, repo: Repo): void {
  app.get("/api/state", async () => {
    return repo.getApiState(Date.now());
  });
}
