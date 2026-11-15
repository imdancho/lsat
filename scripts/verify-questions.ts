/**
 * Step 2 of the optional scripted pipeline: blind-solve every candidate.
 * The model sees only the stimulus, stem and choices. A question survives only
 * if the model picks the keyed answer, is confident, and sees no second
 * defensible choice.
 *
 * Usage:  npx tsx scripts/verify-questions.ts                (writes data/generated/verified.json)
 *         npx tsx scripts/verify-questions.ts --replace-bank (also overwrites data/questions.json)
 *
 * Needs ANTHROPIC_API_KEY and network access to api.anthropic.com.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { callJSON } from "@/lib/anthropic";
import { buildVerifierUser, VERIFIER_SYSTEM } from "@/lib/prompts";
import { QuestionBankSchema, VerifierResultSchema } from "@/lib/schemas";
import { QUESTION_TYPES, type Question } from "@/lib/types";

const MIN_CONFIDENCE = 0.7;
const MIN_TOTAL = 30;
const MIN_PER_TYPE = 6;

const ROOT = process.cwd();
const CANDIDATES_PATH = path.join(ROOT, "data", "generated", "candidates.json");
const VERIFIED_PATH = path.join(ROOT, "data", "generated", "verified.json");
const BANK_PATH = path.join(ROOT, "data", "questions.json");

async function main() {
  const candidates = QuestionBankSchema.parse(
    JSON.parse(readFileSync(CANDIDATES_PATH, "utf8")),
  );
  const kept: Question[] = [];

  for (const question of candidates) {
    const solved = await callJSON(
      VERIFIER_SYSTEM,
      buildVerifierUser(question),
      VerifierResultSchema,
      { maxTokens: 4_000, effort: "medium" },
    );
    const agrees = solved.answerIndex === question.correctIndex;
    if (agrees && !solved.ambiguous && solved.confidence >= MIN_CONFIDENCE) {
      kept.push(question);
    } else {
      console.log(
        `dropped ${question.id}: picked ${solved.answerIndex}, key ${question.correctIndex}, ` +
          `confidence ${solved.confidence}, ambiguous ${solved.ambiguous} (${solved.reason})`,
      );
    }
  }

  writeFileSync(VERIFIED_PATH, `${JSON.stringify(kept, null, 2)}\n`);
  console.log(`${kept.length}/${candidates.length} questions survived the blind solve.`);

  const shortTypes = QUESTION_TYPES.filter(
    (type) => kept.filter((q) => q.type === type).length < MIN_PER_TYPE,
  );
  if (kept.length < MIN_TOTAL || shortTypes.length > 0) {
    console.error(
      `Too few survivors (need ${MIN_TOTAL} in all and ${MIN_PER_TYPE} per type` +
        `${shortTypes.length ? `; short: ${shortTypes.join(", ")}` : ""}). Regenerate and verify again.`,
    );
    process.exit(1);
  }

  if (process.argv.includes("--replace-bank")) {
    writeFileSync(BANK_PATH, `${JSON.stringify(kept, null, 2)}\n`);
    console.log("Replaced data/questions.json. Run scripts/validate-questions.ts next.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
