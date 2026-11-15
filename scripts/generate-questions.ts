/**
 * Step 1 of the optional scripted pipeline: generate candidate questions.
 * Needs ANTHROPIC_API_KEY and network access to api.anthropic.com.
 *
 * Usage:  npx tsx scripts/generate-questions.ts
 * Output: data/generated/candidates.json (then run scripts/verify-questions.ts)
 *
 * The committed bank in data/questions.json was written and checked by hand,
 * so this script never touches it.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { callJSON } from "@/lib/anthropic";
import { buildGeneratorSystem, buildGeneratorUser } from "@/lib/prompts";
import { GeneratedQuestionSchema } from "@/lib/schemas";
import { FLAW_TAGS, QUESTION_TYPES, type Question } from "@/lib/types";

const PER_TYPE = 8;
const BATCH_SIZE = 4;
const DIFFICULTY_MIX = [1, 1, 1, 2, 2, 2, 3, 3];

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "generated");
const styleGuide = readFileSync(path.join(ROOT, "docs", "lsat-style-guide.md"), "utf8");
const system = buildGeneratorSystem(styleGuide);

const flawTags = FLAW_TAGS.filter((tag) => tag !== "none");
let nextFlawTag = 0;

async function main() {
  const questions: Question[] = [];

  for (const type of QUESTION_TYPES) {
    for (let offset = 0; offset < PER_TYPE; offset += BATCH_SIZE) {
      const difficulties = DIFFICULTY_MIX.slice(offset, offset + BATCH_SIZE);
      const tags =
        type === "main_conclusion"
          ? undefined
          : difficulties.map(() => flawTags[nextFlawTag++ % flawTags.length]);

      const batch = await callJSON(
        system,
        buildGeneratorUser({
          type,
          count: difficulties.length,
          difficulties,
          flawTags: tags,
          avoidTopics: questions.map((q) => q.topic),
        }),
        z.array(GeneratedQuestionSchema).length(difficulties.length),
        { maxTokens: 12_000, effort: "medium" },
      );

      batch.forEach((generated, i) => {
        const number = String(offset + i + 1).padStart(3, "0");
        questions.push({ ...generated, type, id: `${type}-${number}` });
      });
      console.log(`${type}: ${offset + batch.length}/${PER_TYPE}`);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, "candidates.json");
  writeFileSync(outPath, `${JSON.stringify(questions, null, 2)}\n`);
  console.log(`Wrote ${questions.length} candidates to ${path.relative(ROOT, outPath)}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
