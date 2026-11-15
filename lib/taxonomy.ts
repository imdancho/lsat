import type {
  FlawTag,
  QuestionType,
  StudentMistakeTag,
  TrapTag,
} from "@/lib/types";

type Entry = { label: string; description: string };

export const QUESTION_TYPE_INFO: Record<
  QuestionType,
  Entry & { /** Prompt for the type-specific free response (step B). */ prompt: string }
> = {
  main_conclusion: {
    label: "Main Conclusion",
    description:
      "Find the one claim the rest of the argument is there to support.",
    prompt: "How do the other statements support it? (optional)",
  },
  flaw: {
    label: "Flaw",
    description: "Say exactly why the evidence does not prove the conclusion.",
    prompt:
      "What's wrong with this reasoning? Describe the flaw in your own words.",
  },
  necessary_assumption: {
    label: "Necessary Assumption",
    description: "Name something the argument cannot do without.",
    prompt: "What must be true for the conclusion to follow?",
  },
  strengthen: {
    label: "Strengthen",
    description: "Add a fact that makes the conclusion more likely.",
    prompt: "Write one new fact that would make the conclusion more likely.",
  },
  weaken: {
    label: "Weaken",
    description: "Add a fact that makes the conclusion less likely.",
    prompt: "Write one new fact that would make the conclusion less likely.",
  },
};

export const FLAW_TAG_INFO: Record<FlawTag, Entry> = {
  correlation_causation: {
    label: "Correlation vs. causation",
    description:
      "Two things occur together, and the argument concludes that one causes the other.",
  },
  unrepresentative_sample: {
    label: "Unrepresentative sample",
    description:
      "A conclusion about a whole group rests on a sample that differs from it in a way that matters.",
  },
  necessary_vs_sufficient: {
    label: "Necessary vs. sufficient",
    description:
      "Something that is required for a result is treated as enough to guarantee it, or the reverse.",
  },
  part_whole: {
    label: "Part vs. whole",
    description:
      "What is true of each part is assumed to be true of the whole, or the reverse.",
  },
  equivocation: {
    label: "Equivocation",
    description: "A key word is used in two different senses.",
  },
  circular_reasoning: {
    label: "Circular reasoning",
    description:
      "The evidence only holds up if the conclusion is already accepted.",
  },
  false_dichotomy: {
    label: "False dichotomy",
    description:
      "Only two options are considered when others are available.",
  },
  appeal_to_authority: {
    label: "Appeal to authority",
    description:
      "A claim is accepted because of who says it, not because of expertise that bears on it.",
  },
  ad_hominem: {
    label: "Ad hominem",
    description:
      "An argument is rejected because of who made it rather than what it says.",
  },
  ignores_alternatives: {
    label: "Ignores alternatives",
    description:
      "Another explanation or another way to reach the goal is never ruled out.",
  },
  term_shift: {
    label: "Term shift",
    description:
      "The evidence is about one thing and the conclusion is about another.",
  },
  absence_of_evidence: {
    label: "Absence of evidence",
    description:
      "Failing to find something is treated as proof that it is not there.",
  },
  percent_vs_number: {
    label: "Percent vs. number",
    description:
      "A claim about amounts is drawn from proportions, or the reverse, without knowing the totals.",
  },
  none: {
    label: "No flaw tested",
    description: "The task is to identify the argument's structure.",
  },
};

export const TRAP_TAG_INFO: Record<TrapTag, Entry> = {
  correct: { label: "Correct", description: "The credited answer." },
  out_of_scope: {
    label: "Out of scope",
    description: "On the topic, but it never touches the logical gap.",
  },
  reversed: {
    label: "Reversed",
    description:
      "Pushes the wrong way: strengthens when asked to weaken, or backs the opposing view.",
  },
  too_strong: {
    label: "Too strong",
    description: "Uses absolute language or claims more than the argument needs.",
  },
  restates_premise: {
    label: "Restates a premise",
    description: "Repeats or confirms what the passage already told you.",
  },
  irrelevant_comparison: {
    label: "Irrelevant comparison",
    description:
      "Compares with a group, place or time the argument does not depend on.",
  },
  wrong_flaw: {
    label: "Wrong flaw",
    description: "Describes a real kind of error that this argument does not make.",
  },
  half_right: {
    label: "Half right",
    description: "Deals with only part of the argument or the evidence.",
  },
  shifted_term: {
    label: "Shifted term",
    description: "Quietly swaps a key term for a different one.",
  },
  not_required: {
    label: "Helpful, not required",
    description:
      "Would help the argument, but the argument survives without it.",
  },
  intermediate_conclusion: {
    label: "Intermediate conclusion",
    description: "A step along the way, not the final point.",
  },
};

export const MISTAKE_TAG_INFO: Record<StudentMistakeTag, Entry> = {
  misidentified_conclusion: {
    label: "Misidentified conclusion",
    description:
      "You picked a claim that is not the argument's final point, often a step that supports it.",
  },
  restated_premise: {
    label: "Restated a premise",
    description: "You repeated a piece of evidence instead of what it is used to prove.",
  },
  missed_gap: {
    label: "Missed the gap",
    description:
      "Your answer does not address the jump between the evidence and the conclusion.",
  },
  too_vague: {
    label: "Too vague",
    description:
      "Your answer could be said of almost any argument; it needs to name the specific problem.",
  },
  wrong_flaw: {
    label: "Wrong flaw",
    description: "You described an error this argument does not actually make.",
  },
  out_of_scope: {
    label: "Out of scope",
    description: "Your point is about the topic but does not bear on the reasoning.",
  },
  reversed_direction: {
    label: "Reversed direction",
    description:
      "Your fact pushes the conclusion the opposite way from what was asked.",
  },
  too_strong: {
    label: "Too strong",
    description: "You claimed more than the argument needs or the evidence allows.",
  },
  necessary_sufficient_confusion: {
    label: "Necessary vs. sufficient",
    description:
      "You gave something that would guarantee the conclusion, not something it requires (or the reverse).",
  },
  ignored_key_term: {
    label: "Ignored a key term",
    description:
      "You overlooked a word in the argument that changes what it claims.",
  },
};
