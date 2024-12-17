import { Timestamp } from "firebase/firestore";
import {
  type TClientProgramRef,
  type TClientProgramWrite,
} from "../entities/client/clientProgram";
import {
  type TOutcomeMeasureAnswers,
  type TOutcomeMeasureAnswersWrite,
  type TOutcomeMeasureAnswersWriteOld,
  type TOutcomeMeasureStandardAnswer,
  type TSectionScoring,
} from "../entities/client/outcomeMeasureAnswer";
import {
  getClientProgramBase,
  getClientProgramDays,
} from "../utilities/clients/programs/get";
import {
  updateClientProgramFields,
  updateProgramDayDate,
} from "../utilities/clients/programs/update";
import { type TOutcomeMeasureId } from "../entities/outcomeMeasure/outcomeMeasure";
import { type TClient } from "../entities/client/client";
import { type TClientProgramDay } from "../entities/client/day";

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

/**
 * @description Updates all days in a program's days subcollection for a specific client.
 * @param {string} clientId - The client ID.
 * @param {string} clientProgramId - The client program ID.
 * @param {DocumentReference} clientProgramRef - Reference to the current program.
 */
async function updateClientProgramDays(
  clientId: string,
  clientProgramId: string,
  days: TClientProgramDay[]
) {
  if (days.length === 0) return;

  const firstDate = new Date(days[0].date);

  await Promise.all(
    days.map(async (day, index) => {
      const newDate = new Date(day.date);
      newDate.setHours(firstDate.getHours() + 12, 0, 0, 0);
      await updateProgramDayDate(
        clientId,
        clientProgramId,
        `${index}`,
        newDate
      );
    })
  );
}

/**
 * @description Updates the program document by:
 * - Modifying the `lastActive` field
 * - Modifying the `painLevels` array
 * - Modifying the `outcomeMeasuresAnswers` field
 * @param {string} clientId - The client ID.
 * @param {DocumentReference} clientProgramRef - Reference to the current program.
 */
async function updateClientProgram(
  clientId: string,
  clientProgramId: string,
  clientProgramRef: TClientProgramRef
) {
  const [clientProgramBase, days] = await Promise.all([
    getClientProgramBase(clientProgramRef),
    getClientProgramDays(clientProgramRef)
  ])

  if (!clientProgramBase) {
    console.warn(`Program for client ${clientId} does not exist.`);
    return;
  }

  if (days.length === 0) return;

  const firstDate = new Date(days[0].date);

  const updatedFields: Partial<TClientProgramWrite> = {};

  // Update `lastActive` property if it exists
  if (clientProgramBase.lastActive) {
    const newDate = new Date(clientProgramBase.lastActive);
    newDate.setHours(firstDate.getHours() + 12, 0, 0, 0);
    updatedFields.lastActive = Timestamp.fromDate(newDate);
  }

  // Update the `painLevels` array
  if (Array.isArray(clientProgramBase.painLevels)) {
    const firstPainLevel = clientProgramBase.painLevels[0];

    if (firstPainLevel.submittedAt) {
      console.log(`Client has already be migrated!`);
      return;
    }
    const updatedPainLevels = clientProgramBase.painLevels.map((painLevel) => {
      // Add `submittedAt` property (copy of the original Timestamp)
      const submittedAt = Timestamp.fromDate(painLevel.date);

      // Update `date` to have the time set to 12:00 PM
      const originalDate = new Date(painLevel.date);
      originalDate.setHours(firstDate.getHours() + 12, 0, 0, 0);

      const updatedDate = Timestamp.fromDate(originalDate);

      return {
        ...painLevel,
        submittedAt,
        date: updatedDate,
      };
    });

    updatedFields.painLevels = updatedPainLevels;
  }

  // Update the `outcomeMeasuresAnswers` field
  if (
    clientProgramBase.outcomeMeasuresAnswers &&
    typeof clientProgramBase.outcomeMeasuresAnswers === "object"
  ) {
    const updatedOutcomeMeasuresAnswers: Partial<
      Record<TOutcomeMeasureId, TOutcomeMeasureAnswersWrite[]>
    > = {};

    for (const [outcomeMeasureId, answers] of Object.entries(
      clientProgramBase.outcomeMeasuresAnswers
    )) {
      updatedOutcomeMeasuresAnswers[outcomeMeasureId as TOutcomeMeasureId] =
        answers.map((answer) => {
          const originalDate = new Date(answer.date);

          // Update `date` to have the time set to 12:00 PM in client's local time zone
          originalDate.setHours(firstDate.getHours() + 12, 0, 0, 0);
          const updatedDate = new Date(originalDate);

          return {
            ...answer,
            date: Timestamp.fromDate(updatedDate),
          };
        });
    }

    updatedFields.outcomeMeasuresAnswers =
      updatedOutcomeMeasuresAnswers as Record<
        TOutcomeMeasureId,
        TOutcomeMeasureAnswersWrite[]
      >;
  }

  // Perform the update if there are fields to modify
  if (Object.keys(updatedFields).length > 0) {
    updatedFields.shouldRefetch = true;
    await updateClientProgramDays(clientId, clientProgramId, days)
    await updateClientProgramFields(clientProgramRef, updatedFields);
  } else {
    console.log(`No updates needed for program of client ${clientId}`);
  }
}

/**
 * @description Function that migrates our clients so they have dates set to 12 instead of midnight on dates, painlevels, OM and lastActive
 */
export async function clientTimezoneMigration(client: TClient) {
  try {
    if ("currentClientProgramRef" in client) {
      const clientId = client.currentClientProgramIdentifiers.clients;
      const clientProgramId = client.currentClientProgramIdentifiers.programs;
      await updateClientProgram(clientId, clientProgramId, client.currentClientProgramRef);
    }
  } catch (error) {
    console.error("Error during processing:", error);
  }
}
