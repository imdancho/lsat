import { z } from "zod";
import {
  FLAW_TAGS,
  QUESTION_TYPES,
  STUDENT_MISTAKE_TAGS,
  TRAP_TAGS,
  type GradeResult,
  type Question,
} from "@/lib/types";

const text = z.string().trim().min(1);
const fiveOf = <T extends z.ZodType>(item: T) =>
  z.tuple([item, item, item, item, item]);

export const QuestionTypeSchema = z.enum(QUESTION_TYPES);
export const FlawTagSchema = z.enum(FLAW_TAGS);
export const TrapTagSchema = z.enum(TRAP_TAGS);
export const StudentMistakeTagSchema = z.enum(STUDENT_MISTAKE_TAGS);
export const DifficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export const ChoiceIndexSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const QuestionKeySchema = z.object({
  conclusion: text,
  premises: z.array(text).min(1),
  gap: text,
  flawTag: FlawTagSchema,
  idealAnswer: text,
  acceptableIdeas: z.array(text).min(3).max(5),
  commonMistakes: z.array(text).min(2).max(4),
});

/** A question without an id — the shape the generator model must return. */
export const GeneratedQuestionSchema = z
  .object({
    type: QuestionTypeSchema,
    difficulty: DifficultySchema,
    topic: text,
    stimulus: text,
    stem: text,
    key: QuestionKeySchema,
    choices: fiveOf(text),
    correctIndex: ChoiceIndexSchema,
    choiceExplanations: fiveOf(text),
    choiceTraps: fiveOf(TrapTagSchema),
    mostTempting: ChoiceIndexSchema,
  })
  .superRefine((q, ctx) => {
    q.choiceTraps.forEach((trap, i) => {
      if ((trap === "correct") !== (i === q.correctIndex)) {
        ctx.addIssue({
          code: "custom",
          path: ["choiceTraps", i],
          message: `"correct" must mark choice ${q.correctIndex} and no other`,
        });
      }
    });
    const wrongTraps = q.choiceTraps.filter((t) => t !== "correct");
    if (new Set(wrongTraps).size !== wrongTraps.length) {
      ctx.addIssue({
        code: "custom",
        path: ["choiceTraps"],
        message: "every wrong choice needs a different trap tag",
      });
    }
    if (q.mostTempting === q.correctIndex) {
      ctx.addIssue({
        code: "custom",
        path: ["mostTempting"],
        message: "mostTempting must point at a wrong choice",
      });
    }
    if ((q.type === "main_conclusion") !== (q.key.flawTag === "none")) {
      ctx.addIssue({
        code: "custom",
        path: ["key", "flawTag"],
        message: 'flawTag is "none" for main_conclusion and only there',
      });
    }
  });
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export const QuestionSchema: z.ZodType<Question> = GeneratedQuestionSchema.and(
  z.object({ id: z.string().regex(/^[a-z_]+-\d{3}$/) }),
);
export const QuestionBankSchema = z.array(QuestionSchema);

const scoreByVerdict = { correct: 1, partial: 0.5, incorrect: 0 } as const;

export const GradeResultSchema: z.ZodType<GradeResult> = z
  .object({
    components: z
      .array(
        z.object({
          name: z.enum(["conclusion", "main"]),
          verdict: z.enum(["correct", "partial", "incorrect"]),
          score: z.number().min(0).max(1),
          feedback: text,
        }),
      )
      .length(2),
    overallScore: z.number().min(0).max(100),
    mistakeTags: z.array(StudentMistakeTagSchema),
    modelAnswer: text,
    tip: text,
  })
  .refine(
    (r) => new Set(r.components.map((c) => c.name)).size === 2,
    { message: 'components must be one "conclusion" and one "main"' },
  )
  // The verdicts are the model's judgment; everything derived from them is
  // computed here, so a model slip can never show numbers that contradict them.
  .transform((r) => {
    const components = (["conclusion", "main"] as const).map((name) => {
      const component = r.components.find((c) => c.name === name)!;
      return { ...component, score: scoreByVerdict[component.verdict] };
    });
    const mean =
      components.reduce((sum, c) => sum + c.score, 0) / components.length;
    const allCorrect = components.every((c) => c.verdict === "correct");
    return {
      ...r,
      components,
      overallScore: Math.round(mean * 100),
      mistakeTags: allCorrect ? [] : [...new Set(r.mistakeTags)],
    };
  });

/** Blind-solve result used by the verification pipeline. */
export const VerifierResultSchema = z.object({
  answerIndex: ChoiceIndexSchema,
  confidence: z.number().min(0).max(1),
  ambiguous: z.boolean(),
  reason: text,
});
export type VerifierResult = z.infer<typeof VerifierResultSchema>;
