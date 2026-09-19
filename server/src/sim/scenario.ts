/**
 * sim/scenario.ts — fixed centers/candidates/questions/answers fixtures.
 *
 * Ownership note (architecture.md §3): data-seeder may edit this file to
 * tune demo data (realistic names, answer sequences that reliably land on a
 * compelling verdict). backend-builder creates the initial version here so
 * the simulator has something deterministic to run against for the M1
 * golden path; nothing below is generated with Math.random().
 */

import type { Rng } from "./rng.js";
import { rngInt } from "./rng.js";

export const CENTER_NAMES = [
  "Bhopal - Arera Colony",
  "Bhopal - MP Nagar",
  "Indore - Vijay Nagar",
  "Indore - Rajwada",
  "Gwalior - City Centre",
  "Jabalpur - Napier Town",
  "Ujjain - Freeganj",
  "Sagar - Civil Lines",
] as const;

export const CANDIDATE_NAME_POOL = [
  "Aarav Sharma", "Ishita Verma", "Rohan Patel", "Ananya Singh",
  "Vivaan Joshi", "Diya Chouhan", "Kabir Malviya", "Saanvi Tiwari",
  "Arjun Yadav", "Myra Dubey", "Reyansh Gupta", "Aditi Sahu",
  "Vihaan Rathore", "Priya Chaturvedi", "Sai Kushwaha", "Riya Mishra",
  "Krishna Solanki", "Anika Bhargava", "Yuvraj Thakur", "Kavya Nema",
  "Dhruv Pandey", "Zara Khan", "Aryan Agnihotri", "Navya Jain",
] as const;

export interface QuestionFixture {
  id: number;
  text: string;
  options: readonly string[];
}

export const QUESTIONS: readonly QuestionFixture[] = [
  { id: 1, text: "Which article of the Indian Constitution abolishes untouchability?", options: ["Article 14", "Article 17", "Article 21", "Article 32"] },
  { id: 2, text: "Madhya Pradesh's state capital is:", options: ["Indore", "Bhopal", "Gwalior", "Jabalpur"] },
  { id: 3, text: "The Narmada river originates in which plateau?", options: ["Deccan", "Malwa", "Amarkantak", "Chotanagpur"] },
  { id: 4, text: "MPOnline is primarily used by the state for:", options: ["e-governance services", "railway ticketing", "banking", "weather forecasting"] },
  { id: 5, text: "A hash chain provides which property?", options: ["Encryption", "Tamper-evidence", "Compression", "Load balancing"] },
] as const;

export interface CenterFixture {
  id: string;
  name: string;
}

export interface SessionFixture {
  id: string;
  centerId: string;
  candidateName: string;
  rollNo: string;
}

export interface Scenario {
  centers: CenterFixture[];
  sessions: SessionFixture[];
  questions: readonly QuestionFixture[];
}

export function buildScenario(centersCount: number, sessionsPerCenter: number): Scenario {
  const centers: CenterFixture[] = [];
  const sessions: SessionFixture[] = [];

  for (let i = 0; i < centersCount; i++) {
    const id = `C${i + 1}`;
    const name = CENTER_NAMES[i % CENTER_NAMES.length];
    centers.push({ id, name });

    for (let j = 0; j < sessionsPerCenter; j++) {
      const globalIdx = i * sessionsPerCenter + j;
      const candidateName = CANDIDATE_NAME_POOL[globalIdx % CANDIDATE_NAME_POOL.length];
      const rollNo = `MPO2026-${String(globalIdx + 1).padStart(4, "0")}`;
      sessions.push({
        id: `S-${id}-${String(j + 1).padStart(2, "0")}`,
        centerId: id,
        candidateName,
        rollNo,
      });
    }
  }

  return { centers, sessions, questions: QUESTIONS };
}

/** Deterministic answer draw for one (session, question) pair, seed-driven. */
export function fixedAnswer(rng: Rng, question: QuestionFixture): string {
  return question.options[rngInt(rng, 0, question.options.length - 1)];
}
