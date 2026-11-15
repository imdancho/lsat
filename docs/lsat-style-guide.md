# LSAT Logical Reasoning — Style Guide for Question Authoring

Derived from an analysis of LSAC's **public** materials:
1. LSAC "Logical Reasoning Sample Questions" page — 10 questions with official explanations.
2. An official free LSAC practice test (PDF) — 2 LR sections, 51 questions, with answer key.

**Copyright rule:** these materials are used only as a style reference. Never reproduce or closely
paraphrase any official stimulus, stem-specific content or answer choice. Do not reuse the topics of the
analyzed official questions: funding of pure research, website vs print ads, an early-1900s bridge collapse,
a 1987 supernova / neutron star, democracy vs freedom, drug pricing by national income, formal poetry and
politics, a lava dam and fossil bones, mandatory headlights, a Renaissance painter's use of red,
driver's licenses, digital piracy.

---

## 1. Format facts (current LSAT)

- Scored sections: **2 × Logical Reasoning + 1 × Reading Comprehension**, 35 minutes each. Logic Games were removed in August 2024.
- An LR section has 25–26 questions, so about **1:20–1:25 per question**.
- Each question has 5 choices (A–E) and exactly one *best* answer. Other choices may seem conceivable but are clearly worse.
- Official directions: answer based on the passage, and don't make assumptions that are implausible, superfluous or incompatible with the passage. No specialized knowledge is needed.

## 2. How often each type appears (one official practice test, 51 LR questions)

| Type | Count |
|---|---|
| Flaw | 8 |
| Assumption (necessary + sufficient) | 6 |
| Strengthen | 5 |
| Principle | 5 |
| Weaken | 4 |
| Resolve / explain | 4 |
| Parallel reasoning / parallel flaw | 4 |
| Agreement / disagreement | 4 |
| Main conclusion | 3 |
| Role / method | 3 |
| Inference | 2 |
| Counter, complete the argument, evaluate | 1 each |

**Our 5 types (Main Conclusion, Flaw, Necessary Assumption, Strengthen, Weaken) cover about 26 of 51 questions, roughly half the LR score.** This is a useful pitch fact.

## 3. Stimulus rules

- Length is **55–110 words**. Official stimuli run about 40–120, mostly 60–100.
- **About half have a speaker label** (role or name: `Economist:`, `Museum director:`, `Councilor Ruiz:`). Use labels on ~50% of ours.
- Two-speaker exchanges appear in ~15% of official questions, mostly for disagreement questions. For our types, use them occasionally: speaker B responds to A, and the question targets B's argument.
- Topic mix: health/medicine, science/archaeology, law/ethics, economics/business, education, arts/music, animals/ecology, public policy. Spread topics evenly; no two questions share a subject.
- Tone is neutral, formal and compact. Everything needed is in the passage.
- Structure: 1–3 premises, one main conclusion, and sometimes an opposing view or an intermediate conclusion.
- Where the conclusion sits:
  - ~40% at the end ("therefore", "thus", "so", "hence", "it follows that", "clearly");
  - ~30% first, followed by support ("…, since…", "…, because…");
  - ~30% in the middle, after a rejected opposing view ("Some claim X. But this is mistaken: …").
- Conclusion forms to vary: a prediction ("will reduce"), a recommendation ("should"), a causal claim ("is responsible for"), a rebuttal ("this view is mistaken"), or a qualified claim ("probably", "at least some").

## 4. Stem patterns (use these, and vary the wording within the pattern)

| Type | Stem patterns |
|---|---|
| Main Conclusion | "Which one of the following most accurately expresses the conclusion drawn in the argument?" · "…the overall conclusion of the [speaker]'s argument?" |
| Flaw | "The reasoning in the argument is flawed in that the argument…" · "The argument is most vulnerable to criticism on the grounds that it…" · "The [speaker]'s reasoning is flawed because it…" |
| Necessary Assumption | "Which one of the following is an assumption required by the argument?" · "The argument depends on assuming which one of the following?" · "The [speaker]'s argument requires the assumption that…" |
| Strengthen | "Which one of the following, if true, most strengthens the argument?" · "…adds the most support for the [speaker]'s conclusion?" |
| Weaken | "Which one of the following, if true, most seriously weakens the argument?" · "…most undermines the [speaker]'s reasoning?" |

## 5. Answer choice rules

- All five choices are similar in length (±30%) and grammatical form. No choice should stand out.
- **The correct answer is often hedged** ("most", "probably", "likely", "at least some"). **Wrong answers often overreach** ("only", "always", "all", "never", "must").
- The official answer key is spread fairly evenly across A–E. **In our bank, balance `correctIndex` exactly: 7 questions per letter across 35.**
- **Flaw choices are abstract descriptions** that start with a verb phrase:
  - "takes for granted that…"
  - "presumes, without providing justification, that…"
  - "fails to consider the possibility that…" / "overlooks the possibility that…"
  - "infers … merely because …"
  - "confuses … with …"
  - "draws a general conclusion from a single case"
  - "treats a condition that is necessary as if it were sufficient"

  Distractors name *real* flaw types the argument does *not* commit, or describe features it lacks (for example, a personal attack or an appeal to authority).

## 6. Trap taxonomy for wrong answers

These match how LSAC's own explanations describe wrong answers: irrelevant, unsupported, overreaching, reversed, already known, contradicts.

| Trap tag | What it is |
|---|---|
| `out_of_scope` | Related to the topic but doesn't touch the logical gap |
| `reversed` | Strengthens when asked to weaken, or the reverse; supports the opposing view |
| `too_strong` | Absolute language; asserts more than needed (especially in NA) |
| `restates_premise` | Repeats or confirms what the passage already says |
| `irrelevant_comparison` | Compares to a group, place or time the argument doesn't depend on |
| `wrong_flaw` | Names a flaw the argument doesn't commit |
| `half_right` | Explains or addresses only part of the argument or evidence |
| `shifted_term` | Subtly swaps a key term (for example, "acts" vs "consequences") |
| `not_required` | NA only: would help, but the argument survives its negation |
| `intermediate_conclusion` | Main Conclusion only: picks a sub-conclusion or premise |

Every wrong choice gets a trap tag, and each wrong choice uses a **different** trap. Deliberately design **one most-tempting distractor**; LSAC explanations sometimes note the "most popular wrong answer". Store its index in `key.mostTempting`.

## 7. Type-specific recipes

**Main Conclusion**
- Include at least one intermediate conclusion or a premise phrased like a claim.
- Distractors: a restated premise, the intermediate conclusion, an overstated version of the conclusion, the opposing view.

**Flaw**
- Build the stimulus around one tag: `correlation_causation`, `unrepresentative_sample`, `necessary_vs_sufficient`, `part_whole`, `equivocation`, `circular_reasoning`, `false_dichotomy`, `appeal_to_authority`, `ad_hominem`, `ignores_alternatives`, `term_shift`, `absence_of_evidence`, `percent_vs_number`.
- The correct answer describes the flaw abstractly, using the verb phrases from section 5.

**Necessary Assumption**
- The correct answer **must pass the negation test**: negate it and the argument collapses.
- It is often a "defender" that rules out a specific objection (for example, the evidence wasn't introduced later, or the measuring tool could have detected X).
- Distractors: sufficient-but-not-necessary, too strong, `not_required`, out of scope.

**Strengthen**
- The correct answer closes the gap, rules out an alternative explanation, or confirms an unstated assumption.
- Include one `reversed` distractor that supports the opposing view.

**Weaken**
- The correct answer does one of these: offers an alternative cause, shows the sample is unrepresentative, shows reverse causation, shows a required assumption is false, or shows the plan won't achieve its goal.
- Include one `reversed` distractor that actually strengthens the argument.

## 8. Difficulty levers

| Level | How to build it |
|---|---|
| 1 Easy | Conclusion has an indicator word, one premise, an obvious gap, distractors clearly off-topic |
| 2 Medium | An opposing view is present, two premises, one tempting distractor |
| 3 Hard | Unmarked conclusion, a sub-conclusion, conditional or quantifier logic (most/some/all), two tempting distractors, abstract answer wording |

Bank mix per type: 3 easy, 2–3 medium, 1–2 hard.

## 9. QA checklist (run on every question before saving)

1. Original: not a paraphrase of any official question, and the topic isn't on the banned list.
2. The stimulus is 55–110 words and has exactly one main conclusion.
3. The stem comes from section 4.
4. Exactly one defensible answer, confirmed by a blind re-solve from stimulus, stem and choices only.
5. Every wrong choice has a distinct trap tag, and `mostTempting` is set.
6. Choices are parallel in length and form. The correct one is not the longest more than about 1 time in 3.
7. No outside knowledge is needed.
8. `key.idealAnswer` is written the way a strong student would say it in 1–2 plain sentences, because students compare their own answer to it.
9. Across the bank, `correctIndex` is balanced, topics are diverse, and speaker labels appear on about 50% of stimuli.
