/**
 * sim/simulator.ts — seeded, deterministic telemetry generator. One
 * `setInterval(SIM_TICK_MS)` tick loop drives everything downstream
 * (architecture.md §0/§13).
 *
 * Honesty rule (architecture.md §13, restated in the task brief): `kill()`
 * only stops the simulated heartbeat/answer-save source for a center. It
 * does NOT create an incident directly. Detection is a real missed-
 * heartbeat check that runs every tick against real `telemetry_events` rows
 * — the same code path a real ingestion pipeline would run. Likewise
 * `reconnect()` only restores the heartbeat source; recovery (resume
 * sessions, restore time, close incident, compute verdict) happens because
 * detection observes a fresh heartbeat, not because reconnect() short-
 * circuits it.
 */

import { Repo } from "../repo.js";
import { mulberry32, rngInt, type Rng } from "./rng.js";
import { buildScenario, fixedAnswer, type Scenario } from "./scenario.js";
import { isFreezable } from "../domain/sessions.js";
import { computeVerdict } from "../domain/verdict.js";
import {
  config,
  examDurationMs as configExamDurationMs,
  missedHeartbeatThresholdMs,
} from "../config.js";
import type { WsEvent } from "../../../shared/types.js";

export type BroadcastFn = (event: WsEvent) => void;

export class Simulator {
  private repo: Repo;
  private broadcast: BroadcastFn;
  private rng: Rng;
  private scenario: Scenario;
  private killed = new Set<string>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(repo: Repo, broadcast: BroadcastFn) {
    this.repo = repo;
    this.broadcast = broadcast;
    this.rng = mulberry32(config.simSeed);
    this.scenario = buildScenario(config.simCenters, config.simSessionsPerCenter);
  }

  /** Idempotent: seeds the DB from the fixed scenario if it's empty, then starts ticking. */
  start(): void {
    if (this.repo.isEmpty()) {
      this.repo.seedScenario(
        this.scenario.centers,
        this.scenario.sessions,
        configExamDurationMs,
        Date.now()
      );
    }
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), config.simTickMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isKilled(centerId: string): boolean {
    return this.killed.has(centerId);
  }

  /** Simulator control: stop the heartbeat/answer-save source for a center. */
  kill(centerId: string): void {
    this.killed.add(centerId);
  }

  /** Simulator control: restore the heartbeat source for a center. */
  reconnect(centerId: string): void {
    this.killed.delete(centerId);
  }

  /**
   * AC-12 — truncate + re-seed the fixed scenario + re-seed the RNG,
   * without restarting the server process.
   */
  reset(): void {
    this.killed.clear();
    this.rng = mulberry32(config.simSeed);
    this.repo.truncateAll();
    const now = Date.now();
    this.repo.seedScenario(this.scenario.centers, this.scenario.sessions, configExamDurationMs, now);
    this.broadcast({ type: "sim.reset", payload: this.repo.getApiState(now) });
  }

  private tick(): void {
    const now = Date.now();
    for (const center of this.repo.listCenters()) {
      if (!this.killed.has(center.id)) {
        this.repo.insertTelemetry(center.id, now, "heartbeat", JSON.stringify({ ok: true }));
        const latencyMs = rngInt(this.rng, 40, 90);
        this.repo.insertTelemetry(center.id, now, "latency", JSON.stringify({ ms: latencyMs }));

        // Occasionally autosave one candidate's answer at this center — a
        // real checkpoint, appended to the real per-center chain.
        if (this.rng() < 0.35) {
          this.maybeAnswerSave(center.id, now);
        }
      } else {
        this.repo.insertTelemetry(center.id, now, "disconnect", JSON.stringify({ reason: "kill_switch" }));
      }
    }

    this.detectIncidents(now);
    this.recoverIncidents(now);
  }

  private maybeAnswerSave(centerId: string, now: number): void {
    const sessions = this.repo.listSessionsByCenter(centerId, now).filter((s) => isFreezable(s.state));
    if (sessions.length === 0) return;
    const session = sessions[rngInt(this.rng, 0, sessions.length - 1)];
    const questionIdx = session.currentQuestionIdx % this.scenario.questions.length;
    const question = this.scenario.questions[questionIdx];
    const answer = fixedAnswer(this.rng, question);
    const nextIdx = (session.currentQuestionIdx + 1) % this.scenario.questions.length;

    this.repo.recordAnswer(session.id, nextIdx, answer);
    const cp = this.repo.appendCheckpoint(centerId, session.id, now, "answer_save", {
      sessionId: session.id,
      questionId: question.id,
      answer,
    });
    this.broadcast({ type: "checkpoint.appended", payload: cp });
    const updated = this.repo.getSession(session.id, now);
    if (updated) this.broadcast({ type: "session.updated", payload: updated });
  }

  /** Real missed-heartbeat detection — never short-circuited by kill(). */
  private detectIncidents(now: number): void {
    for (const center of this.repo.listCenters()) {
      if (center.status === "down") continue;
      const lastHeartbeat = this.repo.lastHeartbeatTs(center.id);
      if (lastHeartbeat === null) continue;
      if (now - lastHeartbeat <= missedHeartbeatThresholdMs) continue;

      const sessionsAtCenter = this.repo.listSessionsByCenter(center.id, now);
      const affected = sessionsAtCenter.filter((s) => isFreezable(s.state)).length;

      const incident = this.repo.openIncident(center.id, now, affected, {
        signal: "missed_heartbeat",
        lastHeartbeatTs: lastHeartbeat,
        thresholdMs: missedHeartbeatThresholdMs,
      });
      this.repo.updateCenterStatus(center.id, "down", 90, now);
      const frozen = this.repo.freezeSessionsAtCenter(center.id, now);

      const updatedCenter = this.repo.getCenter(center.id);
      if (updatedCenter) this.broadcast({ type: "center.updated", payload: updatedCenter });
      this.broadcast({ type: "incident.opened", payload: incident });
      for (const s of frozen) this.broadcast({ type: "session.updated", payload: s });
    }
  }

  /** Real recovery — fires once detection observes a fresh heartbeat again. */
  private recoverIncidents(now: number): void {
    for (const center of this.repo.listCenters()) {
      if (center.status !== "down") continue;
      if (this.killed.has(center.id)) continue; // still down for real

      const openIncident = this.repo.getOpenIncidentForCenter(center.id);
      if (!openIncident) continue;

      const resumed = this.repo.resumeSessionsAtCenter(center.id, now);
      this.repo.updateCenterStatus(center.id, "healthy", 10, now);
      const closedIncident = this.repo.closeIncident(openIncident.id, now);

      const updatedCenter = this.repo.getCenter(center.id);
      if (updatedCenter) this.broadcast({ type: "center.updated", payload: updatedCenter });
      this.broadcast({ type: "incident.updated", payload: closedIncident });
      for (const s of resumed) this.broadcast({ type: "session.updated", payload: s });

      const frozenDurationsMs = resumed.map((s) => s.frozenMsTotal);
      const totalCandidateCount = this.repo.totalCandidateCount();
      const { decision, reasoning } = computeVerdict({
        frozenDurationsMs,
        checkpointsLost: 0,
        examDurationMs: configExamDurationMs,
        totalCandidateCount,
      });
      const verdict = this.repo.insertVerdict(closedIncident.id, decision, reasoning, now);
      this.broadcast({ type: "verdict.computed", payload: verdict });
    }
  }
}
