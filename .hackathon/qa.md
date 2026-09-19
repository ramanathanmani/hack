# QA log

## integration - scaffold

Phase 0 SCAFFOLD (plan.md T00–T05), run by integration-agent. Environment: Node v22.22.2,
npm 10.9.7, Linux.

### Commands run

```bash
$ npm install
# → added 197 packages, and audited 200 packages in 17s
# → 1 high severity vulnerability (transitive, not addressed — pre-existing advisory noise,
#   not a runtime dependency added by this task; left for security-linter at HARDEN)

$ node -e "console.log(require('better-sqlite3'))"
# → [Function: Database] { SqliteError: [Function: SqliteError] }
# native module loads successfully — no ABI/prebuild failure in this environment.
# (architecture.md §11 risk 5 — node:sqlite fallback plan documented as a comment in
#  server/src/db/connection.ts, NOT implemented, since the primary driver works here.)

# End-to-end smoke: open/create the DB via connection.ts, run migrate.ts, confirm schema.
$ npx tsx <scratchpad>/smoke.mts
# → migrations applied this run: [ '001_init.sql' ]
# → tables: [ 'candidate_sessions', 'centers', 'checkpoints', 'incidents',
#             'schema_migrations', 'sqlite_sequence', 'telemetry_events', 'verdicts' ]
# → SMOKE OK
# (temporary sentinel.db removed afterward; data/ stays empty/gitignored until data-seeder runs)

$ npm run typecheck
# → server@0.1.0 typecheck: tsc -p tsconfig.json --noEmit   → clean, no errors
# → web@0.1.0 typecheck: tsc -p tsconfig.json --noEmit      → clean, no errors

$ npm run build
# → web: tsc --noEmit && vite build → dist/index.html + dist/assets/index-*.js (224 kB, gzip 70 kB)
# → server: tsc -p tsconfig.json → dist/server/src/**, dist/shared/**
#   (rootDir is auto-inferred to the monorepo root because server/tsconfig.json includes
#    ../shared/types.ts for cross-workspace typechecking with no build step for shared/;
#    this means the compiled entrypoint lands at dist/server/src/index.js, not dist/index.js —
#    server/package.json's "start" script is set accordingly:
#    "start": "node dist/server/src/index.js". backend-builder: keep this in mind, or adjust
#    tsconfig later if you want a flatter dist/ layout.)

$ npm run check:offline
# → FAIL on first run: matched http://www.w3.org/... (SVG/XML namespace constants, not network
#   calls) and https://react.dev/errors/... (doc link embedded in a minified React error string).
#   Both are compile-time constants baked into React/DOM internals, never fetched at runtime.
#   Fixed by whitelisting those two known-safe patterns in web/scripts/check-offline.mjs.
# → re-run: PASS — no external origins in web/dist
```

### Result

- npm install: PASS
- better-sqlite3 native module smoke check: PASS (loads directly; also proven via a full
  connection.ts → migrate.ts → schema smoke run)
- npm run typecheck (both workspaces): PASS
- npm run build (both workspaces): PASS
- npm run check:offline: PASS (after whitelisting two false-positive constant strings)
- npm start: NOT YET RUNNABLE — `server/src/index.ts` (boot: migrate → seed → Fastify → ws →
  simulator.start) is backend-builder's file, not created in this scaffold pass by design (task
  scope: "Do NOT implement backend routes, business logic, or frontend UI").

### Scope note

This pass touched only integration-agent-owned paths per architecture.md §3: root `package.json` /
`tsconfig.base.json` / `.env.example` / `.gitignore`, `shared/types.ts`, `server/src/db/connection.ts`
+ `db/migrate.ts` + `db/migrations/001_init.sql`, `web/vite.config.ts` (+ minimal `web/package.json`,
`web/tsconfig.json`, `web/index.html`, `web/src/main.tsx` placeholder, `web/scripts/check-offline.mjs`
as scaffold necessities), `docs/architecture.md` (copy), `README.md` stub. No backend routes,
domain logic, or real UI were implemented — that is backend-builder's and frontend-builder's next
work, per plan.md's fork point after T05.
