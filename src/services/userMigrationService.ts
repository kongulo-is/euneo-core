import {
  TOutcomeMeasureAnswers,
  TOutcomeMeasureAnswersWriteOld,
  TOutcomeMeasureStandardAnswer,
  TSectionScoring,
} from "../entities/client/outcomeMeasureAnswer";

// Helper type guard to check if an answer is in the old format
export const isOldOutcomeMeasureAnswer = (
  answer: any
): answer is TOutcomeMeasureAnswersWriteOld => {
  return "sections" in answer;
};

// Migration function to transform old answer structure to new answer structure
export function migrateOutcomeMeasureAnswers(
  oldAnswers: TOutcomeMeasureAnswersWriteOld
): TOutcomeMeasureAnswers {
  const maxQuestionPoints: Record<string, number> = {
    faam: 4,
    hoos: 4,
    koos: 4,
    lefs: 4,
    odi: 5,
    pgq: 3,
  };
  const reverseScore = ["koos", "hoos"].includes(oldAnswers.outcomeMeasureId);
  const isFaam = oldAnswers.outcomeMeasureId === "faam";
  // Convert sections to new answer format
  const answers = {} as Record<string, TOutcomeMeasureStandardAnswer | null>;
  let questionIdCounter = 1;
  // Convert section scoring from the old structure
  const sectionScorings: TSectionScoring[] = oldAnswers.sections.map(
    (section) => {
      const questionIds: string[] = [];
      let scoredPoints = 0;
      let answerCount = 0;
      const oldAnswersListKey = "answers" in section ? "answers" : "questions";
      // @ts-ignore
      section[oldAnswersListKey].forEach((answer: number | null) => {
        // Questions 22 and 28 are not scored in the old om (missing from old faam)
        if (isFaam && (questionIdCounter === 22 || questionIdCounter === 28)) {
          questionIdCounter += 1;
        }
        if (answer !== null) {
          scoredPoints += answer;
          answerCount += 1;
        }
        const id = `q${questionIdCounter}`;
        answers[id] = {
          value: answer,
          type: "option",
        };
        questionIds.push(id);
        questionIdCounter += 1;
      });
      const maxPoints =
        answerCount * maxQuestionPoints[oldAnswers.outcomeMeasureId];

      return {
        sectionName: section.sectionName,
        maxPoints: maxPoints,
        scoredPoints,
        percentageScore: ["odi", "pgq"].includes(oldAnswers.outcomeMeasureId)
          ? 100 - section.score
          : section.score,
        questionIds,
        // @ts-ignore
        skipped: section[oldAnswersListKey].every(
          // @ts-ignore
          (answer) => answer === null || answer === undefined
        ),
      };
    }
  );

  const scoredPoints = sectionScorings.reduce(
    (total, section) => total + section.scoredPoints,
    0
  );

  const maxPoints = sectionScorings.reduce(
    (total, section) => total + section.maxPoints,
    0
  );

  let percentageScore =
    sectionScorings.length > 1
      ? Math.round((scoredPoints / maxPoints) * 100)
      : sectionScorings[0].percentageScore;

  //   Reverse score
  if (reverseScore) {
    percentageScore = 100 - percentageScore;
  }
  // Build the new outcome measure answers object
  return {
    outcomeMeasureId: oldAnswers.outcomeMeasureId,
    scoredPoints, // Sum of all scored points from sections
    maxPoints,
    percentageScore, // Calculate the overall percentage score
    sectionScorings,
    scoringMethod: "percentage", // Default in old outcome measure answers
    date: oldAnswers.date.toDate(),
    answers,
  };
}
