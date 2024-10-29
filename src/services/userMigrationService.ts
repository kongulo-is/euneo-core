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
  const reverseScore = ["koos", "hoos"].includes(oldAnswers.outcomeMeasureId);
  // Convert sections to new answer format
  const answers = {} as Record<string, TOutcomeMeasureStandardAnswer | null>;
  let questionIdCounter = 1;

  // Convert section scoring from the old structure
  const sectionScorings: TSectionScoring[] = oldAnswers.sections.map(
    (section) => {
      const questionIds: string[] = [];
      let scoredPoints = 0;

      section.answers.forEach((answer: number | null) => {
        if (answer !== null) {
          scoredPoints += answer;
        }
        const id = `q${questionIdCounter}`;
        answers[id] = {
          value: answer,
          type: "option",
        };
        questionIds.push(id);
        questionIdCounter += 1;
      });

      const percentageScore = reverseScore
        ? 100 - section.score
        : section.score;

      // reverse calculate with scoredPoints and percentageScore - this is only flipped to calculate the maxPoints for koos and hoos.
      const maxPoints = Math.round(scoredPoints / (percentageScore / 100));

      return {
        sectionName: section.sectionName,
        maxPoints: maxPoints,
        scoredPoints,
        percentageScore: section.score,
        questionIds,
        skipped: section.answers.every(
          (answer) => answer === null || answer === undefined
        ),
      };
    }
  );

  const scoredPoints = sectionScorings.reduce(
    (total, section) => total + section.scoredPoints,
    0
  );

  let percentageScore = Math.round(scoredPoints / sectionScorings.length);

  //   Reverse score
  if (reverseScore) {
    percentageScore = 100 - percentageScore;
  }
  const maxPoints = Math.round(scoredPoints / (percentageScore / 100));

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
