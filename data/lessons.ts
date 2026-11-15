// Short original lessons: one per question type and one per reasoning mistake.
// Each has the same shape so they can be shown by one component.
import { QUESTION_TYPES, STUDENT_MISTAKE_TAGS, type Focus } from "@/lib/types";

export type Lesson = {
  title: string;
  /** Three to five plain sentences. */
  explanation: string;
  /** One worked micro-example: an argument, an answer that misses (weak) and one that works (strong). */
  example: { argument: string; weak: string; strong: string; why: string };
  /** Three things to do on the next question. */
  avoid: [string, string, string];
};

export const LESSON_IDS: Focus[] = [...QUESTION_TYPES, ...STUDENT_MISTAKE_TAGS];

export const LESSONS: Record<Focus, Lesson> = {
  main_conclusion: {
    title: "Find the claim everything else supports",
    explanation:
      "The main conclusion is the one statement the author is trying to get you to accept. Every other sentence is there to back it up, give background, or state a view the author rejects. To find it, ask of each claim whether it is offered as a reason for something else, or whether something else is offered as a reason for it. The conclusion is the claim that receives support and gives none. It can sit anywhere in the passage, and it often has no signal word.",
    example: {
      argument:
        "The café should stop opening at 6 a.m. Almost no one comes in before 7, so the first hour loses money. And the two staff members who cover that hour could instead help with the lunch rush.",
      weak: "The first hour loses money because almost no one comes in before 7.",
      strong: "The café should stop opening at 6 a.m.",
      why: "The lost money and the lunch rush are both reasons for the recommendation. Nothing in the passage is supported by the recommendation itself.",
    },
    avoid: [
      "Ask of each claim whether it gives support or receives it.",
      "Treat 'so' and 'therefore' as clues, not proof; check what follows from what.",
      "State the conclusion as the author's claim, not as your opinion of it.",
    ],
  },
  flaw: {
    title: "Name the gap between evidence and conclusion",
    explanation:
      "In almost every flawed argument, the evidence could all be true while the conclusion is still false. Your job is to say exactly how that could happen. Start by stating the conclusion and the evidence in your own words, then ask what the author is taking for granted to get from one to the other. A good answer names that specific jump; you do not need the textbook name for it.",
    example: {
      argument:
        "Every employee who finished the company's 10-kilometer charity run said they felt energetic afterward. Running that distance, then, leaves people feeling energetic, and the company should urge all its employees to do it.",
      weak: "The evidence is not strong enough to prove the conclusion.",
      strong:
        "The finishers chose to run and were fit enough to finish, so they do not show how running would affect everyone else.",
      why: "The answer that works says who was left out of the evidence and why that matters. The one that misses could be said about any argument.",
    },
    avoid: [
      "State the conclusion and the evidence separately before you judge anything.",
      "Ask how the evidence could be true and the conclusion still false.",
      "Describe the jump in this argument's own terms, not in general words.",
    ],
  },
  necessary_assumption: {
    title: "Find what the argument cannot do without",
    explanation:
      "A necessary assumption is an unstated claim the argument needs: if it were false, the conclusion would no longer follow from the evidence. It is usually modest, often just ruling out one way the argument could fail. Test your answer by denying it. If the argument falls apart, you have found something required; if the argument survives, your answer was only helpful, or more than the argument needs.",
    example: {
      argument:
        "The bakery's new oven bakes bread in half the time of the old one. So the bakery will now be able to sell twice as many loaves each morning.",
      weak: "Customers like bread from the new oven more than bread from the old one.",
      strong:
        "Enough customers come in each morning to buy twice as many loaves as the bakery sells now.",
      why: "Deny the answer that works and the conclusion fails: with too few buyers, faster baking cannot double sales. Deny the one that misses and the argument is untouched, because customers only need to like the bread as much as before.",
    },
    avoid: [
      "Deny your answer and check whether the argument falls apart.",
      "Prefer the smallest claim that does the job; avoid 'all', 'never' and 'only'.",
      "Look for a new idea in the conclusion that the evidence never mentioned.",
    ],
  },
  strengthen: {
    title: "Add a fact that closes the gap",
    explanation:
      "To strengthen an argument you add a new fact that makes the conclusion more likely, without having to prove it. The fact has to bear on the weak spot between the evidence and the conclusion. The most common ways are to rule out another explanation, to show the evidence is typical, or to confirm something the author took for granted. Repeating the evidence, or adding a fact about the topic that does not touch the gap, does nothing.",
    example: {
      argument:
        "After the gym added a free childcare room, its weekday morning attendance rose by a third. The childcare room, the manager concludes, is what brought the new visitors in.",
      weak: "Attendance on weekday mornings went up by a third.",
      strong:
        "Most of the new weekday morning visitors leave a child in the childcare room while they exercise.",
      why: "The answer that works ties the rise to the room itself, which makes other explanations, such as a seasonal bump, less likely. The one that misses only repeats what the manager already said.",
    },
    avoid: [
      "Find the gap first; a strengthener has to touch it.",
      "Offer a fact the passage did not already state.",
      "Check the direction: your fact should make the conclusion more likely, not less.",
    ],
  },
  weaken: {
    title: "Add a fact that opens the gap",
    explanation:
      "To weaken an argument you add a new fact that makes the conclusion less likely, even if the evidence stays true. You are not denying the evidence; you are showing that it could be true for another reason, or that it does not reach as far as the conclusion claims. Look for another cause, a reason the sample is unusual, or a way the plan could fail. A fact that is merely about the same topic leaves the argument where it was.",
    example: {
      argument:
        "A hardware store moved its gardening tools next to the entrance, and sales of those tools doubled the following month. The owner concludes that the new location caused the increase.",
      weak: "The store also sells paint, lumber and many other things.",
      strong:
        "The following month was the start of spring, when sales of gardening tools rise every year.",
      why: "Spring explains the jump in sales without the move, so the owner's cause is no longer the only candidate. The fact about paint and lumber is on topic but leaves the reasoning untouched.",
    },
    avoid: [
      "Accept the evidence as true and attack the step to the conclusion.",
      "Ask what else could explain the evidence.",
      "Check the direction: your fact should make the conclusion less likely, not more.",
    ],
  },
  misidentified_conclusion: {
    title: "A step is not the final point",
    explanation:
      "Arguments often reach a small conclusion on the way to a bigger one. The small one is supported by evidence, so it looks like the point, but the author then uses it as a reason for something further. When you find a claim that is supported, keep going: ask whether the author does anything with it. The main conclusion is the claim that nothing else in the passage rests on.",
    example: {
      argument:
        "The town's only bus line now stops running at 7 p.m., so restaurant workers have no way home after a late shift. The town should therefore extend the bus service until midnight.",
      weak: "Restaurant workers have no way home after a late shift.",
      strong: "The town should extend its bus service until midnight.",
      why: "The workers' problem follows from the early last bus, but the author uses it as the reason for extending the service. The recommendation is where the reasoning ends.",
    },
    avoid: [
      "When a claim is supported, ask whether it then supports something else.",
      "Read to the end before deciding; the final point may come first or last.",
      "Put 'therefore' between your two candidates and see which order makes sense.",
    ],
  },
  restated_premise: {
    title: "Evidence is not the conclusion",
    explanation:
      "A premise is a fact or reason the author gives; the conclusion is what the author wants you to believe because of it. Premises are often the most concrete and memorable sentences, with numbers or studies in them, which is why they are tempting to copy down. Ask what the fact is doing there. If the passage would still make sense with 'and that is why' after your sentence, you have written down a premise.",
    example: {
      argument:
        "Our survey found that 80 percent of members visit the pool, while only 10 percent use the squash courts. The club should convert one squash court into a second changing room for swimmers.",
      weak: "Eighty percent of the club's members visit the pool.",
      strong:
        "The club should turn one squash court into a second changing room for swimmers.",
      why: "The survey numbers are the reason, and the conversion is what they are meant to justify. Nothing in the passage tries to prove the numbers themselves.",
    },
    avoid: [
      "Ask what each fact is there to prove.",
      "Be wary of copying the sentence with the numbers in it.",
      "Check that your answer is a claim the author argues for, not one they start from.",
    ],
  },
  missed_gap: {
    title: "Aim at the jump, not the topic",
    explanation:
      "Almost every argument here has a specific jump: a point where the conclusion says more than the evidence does. An answer misses the gap when it comments on the topic, or on a detail of the evidence, without touching that jump. Before you write, finish this sentence: the evidence is about X, but the conclusion is about Y. Your answer should be about the distance between X and Y.",
    example: {
      argument:
        "In taste tests, most people preferred the new recipe for the canned soup to the old one. So switching to the new recipe will increase the soup's sales.",
      weak: "The taste tests may not have included enough different kinds of soup.",
      strong:
        "Liking the taste in a test does not mean people will buy more of it; price and habit also decide what sells.",
      why: "The evidence is about preference and the conclusion is about sales. The answer that works speaks to that distance, while the one that misses questions the test without connecting it to sales.",
    },
    avoid: [
      "Finish the sentence: the evidence is about X, but the conclusion is about Y.",
      "Make sure your answer mentions both X and Y.",
      "Skip objections that would not change the conclusion even if they were true.",
    ],
  },
  too_vague: {
    title: "Say what is wrong, not that something is",
    explanation:
      "A vague answer points in the right direction but stops before saying anything specific: the evidence is weak, the sample is bad, there could be other factors. Those phrases fit thousands of arguments, so they show you sensed a problem without showing you found it. Push one step further by naming the particular thing: which other factor, weak in what way, unrepresentative of whom. If your answer could be pasted under a different argument and still fit, it is too vague.",
    example: {
      argument:
        "Students at Hillview School who joined the chess club earned higher math grades than those who did not. The principal concludes that playing chess improves math ability.",
      weak: "There could be other factors the principal has not considered.",
      strong:
        "Students who are already good at math may be the ones who choose to join a chess club.",
      why: "Both answers sense the same problem, but only the second names the other factor: who joins. That is the difference between noticing a gap and identifying it.",
    },
    avoid: [
      "Replace 'other factors' with the one factor you have in mind.",
      "Use the argument's own nouns: the people, things and numbers it mentions.",
      "Test your answer: if it fits another argument unchanged, sharpen it.",
    ],
  },
  wrong_flaw: {
    title: "Check the flaw is really there",
    explanation:
      "Some flaws are so familiar that it is easy to see them everywhere: correlation mistaken for cause, a sample that is too small, an attack on the person. Naming one of them only counts if this argument actually commits it. Before you settle on a flaw, point to the words in the passage where it happens. If you cannot find the place, the argument is making a different mistake.",
    example: {
      argument:
        "To join the volunteer fire brigade, a person must pass a fitness test. Dana passed the fitness test last week, so Dana will be accepted into the brigade.",
      weak: "It draws a conclusion from too small a sample, since Dana is only one person.",
      strong:
        "Passing the test is required to join, but that does not mean passing is enough to be accepted.",
      why: "No sample is involved: the argument applies a rule to one person. Its mistake is treating a requirement as a guarantee.",
    },
    avoid: [
      "Point to the exact words where the flaw happens.",
      "Restate the argument before you reach for a familiar flaw.",
      "Ask whether fixing your flaw would actually fix the argument.",
    ],
  },
  out_of_scope: {
    title: "On topic is not the same as relevant",
    explanation:
      "A fact can be about the same subject as the argument and still do nothing to it. What matters is whether the fact changes how well the evidence supports the conclusion. Test your answer by asking whether, if it were true, the conclusion would become more or less likely. If the honest answer is neither, the fact is out of scope, however interesting it is.",
    example: {
      argument:
        "A city replaced the bulbs in its streetlights with brighter ones, and reported burglaries fell the next year. The mayor concludes that brighter streetlights deter burglars.",
      weak: "Brighter bulbs use less electricity than the old ones did.",
      strong:
        "Burglaries fell just as much that year in nearby cities that kept their old streetlights.",
      why: "Asked to weaken this argument, a fact about electricity is on topic but says nothing about burglars. The comparison with nearby cities bears directly on whether the lights caused the drop.",
    },
    avoid: [
      "Ask whether your fact makes the conclusion more or less likely.",
      "Tie your fact to the link between the evidence and the conclusion.",
      "Drop facts that are merely interesting or merely about the same subject.",
    ],
  },
  reversed_direction: {
    title: "Check which way your fact pushes",
    explanation:
      "On strengthen and weaken questions it is easy to find the right gap and then push it the wrong way. A fact that helps the conclusion is wrong when you were asked to weaken it, no matter how relevant it is. This usually happens when you lose track of what the conclusion is, or of which side of a comparison it favors. Before you write, say the task in one line: I need the conclusion to look more likely, or less.",
    example: {
      argument:
        "A dairy farmer began playing classical music in the barn, and the cows gave more milk the following month. The farmer concludes that the music increased milk production.",
      weak: "When the music was switched off for a week, milk production dropped again.",
      strong: "That same month the farmer also switched the herd to a richer feed.",
      why: "Asked to weaken this argument, the first fact does the opposite: it makes the music look more responsible. The second offers another cause for the extra milk.",
    },
    avoid: [
      "Write the task in one line before you answer: more likely, or less.",
      "Restate the conclusion, then ask what your fact does to it.",
      "On comparisons, check which side the conclusion favors.",
    ],
  },
  too_strong: {
    title: "Claim only as much as you need",
    explanation:
      "Words like all, never, only and always turn a reasonable point into one that is easy to knock down. On assumption questions, the argument rarely needs anything that sweeping; when you state a conclusion or describe a flaw, the passage rarely claims that much. Ask how little would do the job: if your answer still works with 'some' or 'at least one' in place of 'all', the smaller version is the better answer. A new fact offered to strengthen or weaken is the exception, because there a sweeping fact does more, not less.",
    example: {
      argument:
        "The library started lending board games last year, and since then more teenagers have been visiting. So the board games are attracting teenagers to the library.",
      weak: "The board games are the only thing at the library that changed last year.",
      strong:
        "The rise in teenage visitors is not due entirely to something else that changed last year.",
      why: "The argument can live with other changes, such as a new study room, as long as they do not account for the whole rise. Deny the modest version and the argument fails, which is all that 'required' means.",
    },
    avoid: [
      "Find 'all', 'only', 'never' and 'always' in your answer and question each one.",
      "Try 'some' or 'at least one' and see if the argument still stands.",
      "Match the strength of your claim to the strength of the conclusion.",
    ],
  },
  necessary_sufficient_confusion: {
    title: "Required is not the same as enough",
    explanation:
      "Something is sufficient if, added to the evidence, it would guarantee the conclusion, and necessary if the argument cannot work without it: deny it and the evidence no longer supports the conclusion. They are different questions, and a claim can be one without being the other. When you are asked what an argument requires, an answer that would prove the conclusion outright is usually more than it needs. Use the denial test: a required assumption is one whose denial breaks the argument.",
    example: {
      argument:
        "Priya has practiced her presentation every evening this week, far more than she usually practices. So her presentation to the board on Friday will go well.",
      weak: "Anyone who practices a presentation every evening for a week always presents well.",
      strong:
        "How well Priya presents depends at least partly on how much she has practiced.",
      why: "The answer that misses would guarantee the conclusion, but the argument can survive without so broad a rule. Deny the one that works and the practice tells us nothing about Friday, so it is truly required.",
    },
    avoid: [
      "Ask whether your answer guarantees the conclusion or is merely needed for it.",
      "Deny your answer; a required assumption breaks the argument when denied.",
      "Be suspicious of answers that would settle the matter outright.",
    ],
  },
  ignored_key_term: {
    title: "Small words change the claim",
    explanation:
      "Words such as most, some, only, usually and probably set how much an argument is claiming. If you read 'most' as 'all', or miss an 'only', you end up answering a different argument from the one on the page. The conclusion's exact strength decides what counts as a flaw, an assumption, or a relevant fact. Read the conclusion twice, and carry its qualifying words into your own answer.",
    example: {
      argument:
        "Most of the apartments in the new building have balconies. Jordan has just rented an apartment in the building, so Jordan's apartment probably has a balcony.",
      weak: "The conclusion is that Jordan's apartment has a balcony.",
      strong:
        "The conclusion is that Jordan's apartment probably has a balcony, which is all that 'most' can support.",
      why: "Dropping 'probably' turns a careful claim into a careless one and invites an objection the author already avoided. The qualifying word is part of the conclusion.",
    },
    avoid: [
      "Underline 'most', 'some', 'only', 'usually' and 'probably' as you read.",
      "Copy the conclusion's qualifying words into your own answer.",
      "Before objecting, check that the author actually claimed that much.",
    ],
  },
};
