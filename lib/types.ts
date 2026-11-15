// Shared domain types. The value lists are the single source of truth: the
// union types below and the zod enums in lib/schemas.ts are both derived from them.

export const QUESTION_TYPES = [
  "main_conclusion",
  "flaw",
  "necessary_assumption",
  "strengthen",
  "weaken",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** The reasoning error built into an argument ("none" for main_conclusion). */
export const FLAW_TAGS = [
  "correlation_causation",
  "unrepresentative_sample",
  "necessary_vs_sufficient",
  "part_whole",
  "equivocation",
  "circular_reasoning",
  "false_dichotomy",
  "appeal_to_authority",
  "ad_hominem",
  "ignores_alternatives",
  "term_shift",
  "absence_of_evidence",
  "percent_vs_number",
  "none",
] as const;
export type FlawTag = (typeof FLAW_TAGS)[number];

/** Why an answer choice is wrong ("correct" marks the right one). */
export const TRAP_TAGS = [
  "correct",
  "out_of_scope",
  "reversed",
  "too_strong",
  "restates_premise",
  "irrelevant_comparison",
  "wrong_flaw",
  "half_right",
  "shifted_term",
  "not_required",
  "intermediate_conclusion",
] as const;
export type TrapTag = (typeof TRAP_TAGS)[number];

/** Mistakes the grader can attribute to a student's free-text answer. */
export const STUDENT_MISTAKE_TAGS = [
  "misidentified_conclusion",
  "restated_premise",
  "missed_gap",
  "too_vague",
  "wrong_flaw",
  "out_of_scope",
  "reversed_direction",
  "too_strong",
  "necessary_sufficient_confusion",
  "ignored_key_term",
] as const;
export type StudentMistakeTag = (typeof STUDENT_MISTAKE_TAGS)[number];

/** What a lesson teaches or a drill targets: a question type or a reasoning mistake. */
export type Focus = QuestionType | StudentMistakeTag;

export type Difficulty = 1 | 2 | 3;
export type ChoiceIndex = 0 | 1 | 2 | 3 | 4;
export type FiveOf<T> = [T, T, T, T, T];

/** Expert answer key. Server-only until the student has been graded. */
export type QuestionKey = {
  conclusion: string;
  premises: string[];
  gap: string;
  flawTag: FlawTag;
  idealAnswer: string;
  acceptableIdeas: string[];
  commonMistakes: string[];
};

export type Question = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  topic: string;
  stimulus: string;
  stem: string;
  key: QuestionKey;
  choices: FiveOf<string>;
  correctIndex: ChoiceIndex;
  choiceExplanations: FiveOf<string>;
  choiceTraps: FiveOf<TrapTag>;
  mostTempting: ChoiceIndex;
};

/** What the browser may see before the student submits an answer. */
export type PublicQuestion = Pick<
  Question,
  "id" | "type" | "difficulty" | "topic" | "stimulus" | "stem" | "choices"
>;

/** Enough to list a question or link to it; safe to send to the browser. */
export type QuestionSummary = Pick<
  Question,
  "id" | "type" | "difficulty" | "topic"
>;

/** The answer-side fields, released by /api/grade once grading is done. */
export type QuestionReveal = Pick<
  Question,
  "correctIndex" | "choiceExplanations" | "choiceTraps" | "mostTempting"
> & { flawTag: FlawTag };

export type Verdict = "correct" | "partial" | "incorrect";

export type GradeComponent = {
  name: "conclusion" | "main";
  verdict: Verdict;
  score: number;
  feedback: string;
};

export type GradeResult = {
  components: GradeComponent[];
  overallScore: number;
  mistakeTags: StudentMistakeTag[];
  modelAnswer: string;
  tip: string;
};

/** Body of POST /api/grade: two answer fields, or one voice recording for both. */
export type GradeRequest =
  | {
      questionId: string;
      answers: { conclusion: string; main: string };
      /** "voice" when any of the text was dictated. */
      inputMode?: InputMode;
    }
  | { questionId: string; mode: "voice_single"; transcript: string };

/** Successful response of POST /api/grade: the grade plus the answer-side reveal. */
export type GradeResponse = { result: GradeResult } & QuestionReveal;

/** Error body used by every API route. */
export type ApiErrorBody = { error: { code: string; message: string } };

export type InputMode = "typed" | "voice";

/** One finished question, stored in localStorage under "prephrase:v1". */
export type Attempt = {
  questionId: string;
  type: QuestionType;
  flawTag: FlawTag;
  /** Reasoning score, 0–100. Null when the question was answered in multiple-choice mode, without AI grading. */
  score: number | null;
  mistakeTags: StudentMistakeTag[];
  mcqCorrect: boolean | null;
  mcqTrap: TrapTag | null;
  inputMode: InputMode;
  at: string;
};

/** Body of POST /api/reveal: the choice a student picked in multiple-choice mode. */
export type RevealRequest = { questionId: string; pick: ChoiceIndex };

export const PRO_PLANS = ["pro_monthly", "test_day"] as const;
export type ProPlan = (typeof PRO_PLANS)[number];

/** The Pro flag saved in this browser after a confirmed (test-mode) checkout. */
export type Membership = { pro: true; plan: ProPlan; since: string };

/** AI-graded answers used on one local calendar day (YYYY-MM-DD), for the free plan's daily limit. */
export type Usage = { day: string; count: number };

/** Body and successful response of POST /api/checkout. */
export type CheckoutRequest = { plan: ProPlan };
export type CheckoutResponse = { url: string };

/** Response of GET /api/checkout/verify. */
export type VerifyResponse =
  | { ok: true; plan: ProPlan; email: string | null }
  | { ok: false };

/** Body of POST /api/early-access. */
export type EarlyAccessRequest = { email: string; plan: ProPlan };
