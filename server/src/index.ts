/**
 * index.ts — Fastify app entrypoint. Boot sequence (architecture.md §3):
 * migrate -> seed (via simulator.start()) -> Fastify -> ws -> simulator.start().
 *
 * Static serving of the built web bundle in production
 * (`@fastify/static` -> `../../web/dist`) is `server/src/static.ts`,
 * integration-agent's file per architecture.md §3. It is registered last,
 * only when NODE_ENV=production, so dev mode (Vite dev server + proxy) is
 * unaffected and there is no SPA-fallback 404 handler competing with API
 * routes during development.
 */

import Fastify from "fastify";
import { getDb } from "./db/connection.js";
import { migrate } from "./db/migrate.js";
import { Repo, getRepo } from "./repo.js";
import { Hub } from "./ws/hub.js";
import { Simulator } from "./sim/simulator.js";
import { registerStateRoutes } from "./routes/state.js";
import { registerCenterRoutes } from "./routes/centers.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerIncidentRoutes } from "./routes/incidents.js";
import { registerVerdictRoutes } from "./routes/verdicts.js";
import { registerAuditRoutes } from "./routes/audit.js";
import { registerSimRoutes } from "./routes/sim.js";
import { registerStatic } from "./static.js";
import { config } from "./config.js";
import type { WsEvent } from "../../shared/types.js";

export async function buildApp() {
  const db = getDb(config.dbPath);
  const ranMigrations = migrate(db);
  if (ranMigrations.length > 0) {
    console.log(`[migrate] applied: ${ranMigrations.join(", ")}`);
  }

  const repo: Repo = getRepo();
  const app = Fastify({ logger: false });

  app.setErrorHandler((error: Error & { statusCode?: number }, _req, reply) => {
    app.log.error(error);
    const status = error.statusCode ?? 500;
    reply.code(status).send({ error: "internal_error", message: error.message });
  });

  // Fastify creates the underlying http.Server synchronously, so the WS
  // hub can attach to it before app.listen()/app.ready() runs.
  const hub = new Hub(app.server, "/ws");
  const broadcast = (event: WsEvent) => hub.broadcast(event);
  const simulator = new Simulator(repo, broadcast);

  registerStateRoutes(app, repo);
  registerCenterRoutes(app, repo);
  registerSessionRoutes(app, repo);
  registerIncidentRoutes(app, repo);
  registerVerdictRoutes(app, repo);
  registerAuditRoutes(app, repo, broadcast);
  registerSimRoutes(app, repo, simulator);

  if (config.nodeEnv === "production") {
    await registerStatic(app);
  }

  simulator.start();

  return { app, hub, simulator, repo };
}

async function main(): Promise<void> {
  const { app } = await buildApp();
  await app.listen({ port: config.port, host: config.host });
  console.log(`[sentinel] listening on http://${config.host}:${config.port} (${config.nodeEnv})`);
}

// Only auto-start when run directly (not when imported by tests/scripts).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error("[sentinel] fatal boot error", err);
    process.exit(1);
  });
}
