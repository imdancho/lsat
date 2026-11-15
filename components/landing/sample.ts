// The worked example shown on the landing page: one original argument, a
// student's answer to it, and the feedback that answer would earn. It is an
// illustration, labeled as an example wherever it appears; real feedback
// always comes from the grader.
import type { TypeStats } from "@/lib/stats";
import type { GradeResult, QuestionType } from "@/lib/types";

export const SAMPLE_ARGUMENT =
  "City council member: Our bike-share program should be expanded to every neighborhood. In a survey of current bike-share members, nine out of ten said the program had improved their daily commute. Clearly, residents across the city would benefit from having the bikes nearby.";

export const SAMPLE_ANSWERS = {
  conclusion: "The city should expand bike-share to every neighborhood.",
  main: "The survey might be wrong.",
};

export const SAMPLE_FEEDBACK: GradeResult = {
  components: [
    {
      name: "conclusion",
      verdict: "correct",
      score: 1,
      feedback:
        "Right: the council member is arguing that the program should be expanded to every neighborhood. The survey result is the evidence for that, not the conclusion.",
    },
    {
      name: "main",
      verdict: "partial",
      score: 0.5,
      feedback:
        "“The survey might be wrong” is too general to pin down the problem. What weakens this survey is who answered it: only current members, the people the program already works for.",
    },
  ],
  overallScore: 75,
  mistakeTags: ["too_vague"],
  modelAnswer:
    "The survey asked only current members, who are the residents most likely to be happy with the program. Their answers say little about people who never joined or who quit, so the sample is unrepresentative.",
  tip: "When the evidence is a survey, ask who was surveyed and who was left out.",
};

/** A sample reasoning profile: 18 graded answers over five question types. */
export const SAMPLE_TYPE_STATS: Record<QuestionType, TypeStats> = {
  main_conclusion: { attempts: 4, averageScore: 86, picks: 4, correctPicks: 4 },
  flaw: { attempts: 5, averageScore: 58, picks: 5, correctPicks: 3 },
  necessary_assumption: { attempts: 3, averageScore: 64, picks: 3, correctPicks: 2 },
  strengthen: { attempts: 3, averageScore: 77, picks: 3, correctPicks: 3 },
  weaken: { attempts: 3, averageScore: 72, picks: 3, correctPicks: 2 },
};

/** Headline numbers that agree with SAMPLE_TYPE_STATS. */
export const SAMPLE_SUMMARY = {
  questionsDone: 18,
  averageScore: 71,
  correctPicks: 14,
  picks: 18,
  streakDays: 4,
};
