/**
 * static.ts — prod-only static serving of the built web bundle
 * (architecture.md §3: "prod-only: @fastify/static serving ../../web/dist +
 * SPA fallback"). integration-agent owns this file.
 *
 * `npm run build` compiles this to `dist/server/src/static.js`, so the path
 * to the web build from the *compiled* file is
 * `dist/server/src/static.js` -> `../../../../web/dist`.
 * From the *source* file (`tsx watch` dev mode, NODE_ENV=development) this
 * module is not registered at all — dev uses the Vite dev server + proxy
 * instead (vite.config.ts). Both paths are computed relative to import.meta.url
 * so this works regardless of cwd.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";

export async function registerStatic(app: FastifyInstance): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // Compiled location: dist/server/src/static.js -> repo root is 4 levels up.
  const webDist = path.resolve(here, "../../../../web/dist");

  await app.register(fastifyStatic, {
    root: webDist,
    wildcard: false,
  });

  // SPA fallback: any non-/api, non-/ws GET that isn't a static file resolves
  // to index.html so the client-side router (web/src/router.tsx) can handle
  // it. Registered after the API routes in index.ts, so /api/* still 404s
  // normally if unmatched.
  app.setNotFoundHandler((req, reply) => {
    if (req.method !== "GET" || req.url.startsWith("/api") || req.url.startsWith("/ws")) {
      reply.code(404).send({ error: "not_found" });
      return;
    }
    reply.sendFile("index.html", webDist);
  });
}
