/**
 * Validates data/questions.json without any network access:
 *   1. every question against the zod schema, and
 *   2. the bank as a whole against docs/lsat-style-guide.md.
 *
 * Usage:  npx tsx scripts/validate-questions.ts            (check only)
 *         npx tsx scripts/validate-questions.ts --report   (also rewrite docs/question-bank-report.md)
 *
 * Exits with code 1 if any rule is broken.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { QuestionBankSchema } from "@/lib/schemas";
import { QUESTION_TYPES, type Question, type QuestionType } from "@/lib/types";
import { buildReport, type ReviewLog } from "./lib/bank-report";
import { countWords, hasSpeakerLabel, isCorrectLongest } from "./lib/bank-stats";

const ROOT = process.cwd();
const BANK_PATH = path.join(ROOT, "data", "questions.json");
const REVIEW_LOG_PATH = path.join(ROOT, "data", "review-log.json");
const REPORT_PATH = path.join(ROOT, "docs", "question-bank-report.md");

/** Stem openings allowed by section 4 of the style guide. */
const STEM_PATTERNS: Record<QuestionType, RegExp[]> = {
  main_conclusion: [
    /^Which one of the following most accurately expresses the (overall )?conclusion (drawn in|of) /,
  ],
  flaw: [
    /^The reasoning in the argument is flawed in that the argument$/,
    /argument is most vulnerable to criticism on the grounds that it$/,
    /reasoning is flawed because it$/,
  ],
  necessary_assumption: [
    /^Which one of the following is an assumption required by the argument\?$/,
    /argument depends on assuming which one of the following\?$/,
    /argument requires the assumption that$/,
  ],
  strengthen: [
    /^Which one of the following, if true, most strengthens the /,
    /^Which one of the following, if true, adds the most support for the /,
  ],
  weaken: [
    /^Which one of the following, if true, most seriously weakens the /,
    /^Which one of the following, if true, most undermines the /,
  ],
};

/** Subjects of the official questions analysed for the style guide. */
const BANNED_TOPIC_PATTERNS = [
  /pure research/i,
  /print ad/i,
  /bridge/i,
  /supernova|neutron star/i,
  /democra/i,
  /\bpoe(m|t|try)/i,
  /\blava\b|fossil/i,
  /headlight/i,
  /renaissance/i,
  /driver'?s licen/i,
  /pirac/i,
];

const errors: string[] = [];
const fail = (id: string, message: string) => errors.push(`${id}: ${message}`);

function checkQuestion(q: Question) {
  if (!q.id.startsWith(`${q.type}-`)) fail(q.id, "id prefix must match type");

  const words = countWords(q.stimulus);
  if (words < 55 || words > 110) {
    fail(q.id, `stimulus is ${words} words (style guide: 55–110)`);
  }
  if (BANNED_TOPIC_PATTERNS.some((p) => p.test(`${q.topic} ${q.stimulus}`))) {
    fail(q.id, "stimulus touches a topic used by an official question");
  }
  if (!STEM_PATTERNS[q.type].some((p) => p.test(q.stem))) {
    fail(q.id, "stem does not follow a section 4 pattern for its type");
  }

  const lengths = q.choices.map((c) => c.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  lengths.forEach((len, i) => {
    if (Math.abs(len / mean - 1) > 0.3) {
      fail(q.id, `choice ${"ABCDE"[i]} is not within ±30% of the mean length`);
    }
  });
  if (new Set(q.choices).size !== q.choices.length) {
    fail(q.id, "duplicate answer choices");
  }

  const traps = new Set(q.choiceTraps);
  if (q.type === "flaw" && q.choices.some((c) => !/^[a-z]/.test(c))) {
    fail(q.id, "flaw choices must be verb phrases that complete the stem");
  }
  if ((q.type === "strengthen" || q.type === "weaken") && !traps.has("reversed")) {
    fail(q.id, "needs one distractor that pushes the wrong way (reversed)");
  }
  if (
    q.type === "main_conclusion" &&
    !traps.has("intermediate_conclusion") &&
    !traps.has("restates_premise")
  ) {
    fail(q.id, "needs a distractor drawn from the argument's own support");
  }
  if (traps.has("not_required") && q.type !== "necessary_assumption") {
    fail(q.id, "not_required is a necessary-assumption trap only");
  }
  if (traps.has("intermediate_conclusion") && q.type !== "main_conclusion") {
    fail(q.id, "intermediate_conclusion is a main-conclusion trap only");
  }
}

function checkBank(bank: Question[]) {
  const ids = bank.map((q) => q.id);
  if (new Set(ids).size !== ids.length) fail("bank", "duplicate ids");

  const topics = bank.map((q) => q.topic.toLowerCase());
  if (new Set(topics).size !== topics.length) fail("bank", "two questions share a topic");

  if (bank.length < 30) fail("bank", `only ${bank.length} questions (need at least 30)`);

  const byIndex = [0, 1, 2, 3, 4].map(
    (i) => bank.filter((q) => q.correctIndex === i).length,
  );
  if (new Set(byIndex).size !== 1) {
    fail("bank", `correctIndex is not balanced: ${byIndex.join(" / ")}`);
  }

  for (const type of QUESTION_TYPES) {
    const ofType = bank.filter((q) => q.type === type);
    if (ofType.length < 6) fail("bank", `${type}: only ${ofType.length} questions`);
    const [easy, medium, hard] = [1, 2, 3].map(
      (d) => ofType.filter((q) => q.difficulty === d).length,
    );
    if (easy !== 3 || medium < 2 || medium > 3 || hard < 1 || hard > 2) {
      fail("bank", `${type}: difficulty mix ${easy}/${medium}/${hard} (want 3 / 2–3 / 1–2)`);
    }
  }

  const labelled = bank.filter((q) => hasSpeakerLabel(q.stimulus)).length;
  const labelShare = labelled / bank.length;
  if (labelShare < 0.4 || labelShare > 0.6) {
    fail("bank", `${labelled}/${bank.length} stimuli have a speaker label (want about half)`);
  }

  const longest = bank.filter(isCorrectLongest).length;
  if (longest / bank.length > 1 / 3) {
    fail("bank", `the correct answer is the longest choice in ${longest}/${bank.length} questions (want at most 1 in 3)`);
  }
}

const parsed = QuestionBankSchema.safeParse(
  JSON.parse(readFileSync(BANK_PATH, "utf8")),
);
if (!parsed.success) {
  console.error("Schema validation failed:");
  for (const issue of parsed.error.issues) {
    console.error(`  [${issue.path.join(".")}] ${issue.message}`);
  }
  process.exit(1);
}

const bank = parsed.data;
bank.forEach(checkQuestion);
checkBank(bank);

if (errors.length > 0) {
  console.error(`${errors.length} problem(s) in data/questions.json:`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`OK: ${bank.length} questions pass the schema and the style-guide checks.`);

if (process.argv.includes("--report")) {
  const reviewLog = JSON.parse(readFileSync(REVIEW_LOG_PATH, "utf8")) as ReviewLog;
  writeFileSync(REPORT_PATH, buildReport(bank, reviewLog));
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);
}
