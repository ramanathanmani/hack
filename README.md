# Sentinel — Exam Integrity Control Tower

Reference prototype for MPOnline Idea & Innovation Hackathon 2026 (PS06). One Node process
(Fastify + WS + SQLite via `better-sqlite3`) owns a deterministic telemetry simulator, a
tamper-evident SHA-256 hash chain, and serves a React 19 + Vite UI. Fully offline, no auth, no
API keys, no cloud dependency. See `.hackathon/architecture.md` for the full design.

> Status: scaffold only. Backend/frontend implementation lands next (see `.hackathon/plan.md`).

## Run locally

```bash
# install (the only step that touches the network)
npm install

# copy env defaults (optional — every var has a working default)
cp .env.example .env

# local dev: two processes, HMR — API :8080 + Vite :5173 with proxy
npm run dev

# single-command run of the real thing: build UI, serve everything from :8080
npm run build && npm start
# → http://127.0.0.1:8080
```

## Tests & checks

```bash
npm test               # node:test via tsx across server/test/**
npm run test:chain     # AC-7/AC-8 fast loop for the ledger
npm run typecheck      # tsc --noEmit, both workspaces
npm run check:offline  # greps web/dist for external origins (AC-14 guard)
```

## Demo utilities

```bash
npm run seed          # reset DB to the fixed scenario
npm run reset         # delete data/sentinel.db, migrate, seed (hard reset)
npm run verify-chain  # CLI PASS/FAIL chain verification
npm run tamper        # CLI raw-UPDATE tamper (second path to the in-app tamper control)
```

## Stack

Node.js 22 + TypeScript · Fastify 5 + raw `ws` · SQLite via `better-sqlite3` · hand-rolled
SHA-256 hash chain (`node:crypto`), sharded per center · React 19 + Vite 6 + plain CSS ·
deterministic seeded telemetry simulator · npm workspaces (`server/`, `web/`, `shared/`).
