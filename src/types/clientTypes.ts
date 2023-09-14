/**
 * ! Þetta er ekki physioClient heldur client
 */

import { TConditionId, TOutcomeMeasureId, TPhase } from "./baseTypes";

/**
 * @description Client data from client collection
 * @param platform ios or android
 * @param currentProgramId Id of the program the client is currently doing
 * @param programs Array of programs progress data from programs subcollection to client
 */
export type TClientProfile = {
  name: string;
  birthDate: Date;
  gender: "male" | "female" | "other";
  platform: "ios" | "android";
  currentProgramId?: string;
  programs?: { [key: string]: TClientProgram };
};

/**
 * @description Pain level of client
 * @param painIndex 0-9
 */
export type TPainLevel = {
  painIndex: number;
  date: Date;
};

/**
 * @memberof TClientProgram
 * @description Assessment of client during program.
 * @param name (FAAM, SF-36, VISA-A, PROMIS,...)
 */
export type TOutcomeMeasureAnswers = {
  date: Date;
  name: TOutcomeMeasureId;
  type: string | "foot&ankle"; //TODO: what is dis?
  sections: TOutcomeMeasureAnswerSection[];
};

/**
 * @memberof TOutcomeMeasureAnswers
 * @description Assessment result and answers.
 * @param score 0-100%
 * @param answers array of answeres to questions (0-4)
 */
export type TOutcomeMeasureAnswerSection = {
  score: number;
  answers: (number | null)[];
};

/**
 * @memberof TClientProgram
 * @description Each day in clients program, progress. (date, adherence, restDay, etc.)
 * @param dayId (d1, d2, d3...)
 * @param phaseId (p1, p2, p3...)
 * @param adherence 0-100%
 * @param exercises array completed exercises in a day (0 = not completed, 1 = completed)
 */
export type TClientProgramDay = {
  dayId: string;
  phaseId?: string;
  date: Date;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

/**
 * @memberof TClientProgram
 * @description Physical information about the client
 * */
export type TClientPhysicalInformation = {
  athlete: boolean;
  height: number;
  weight: number;
  unit: "metric" | "imperial";
  physicalActivity: "None" | "Low" | "Moderate" | "High";
};

// Common properties
export type TClientProgramCommon = {
  clientProgramId: string;
  conditionId: TConditionId;
  outcomeMeasuresAnswers: TOutcomeMeasureAnswers[];
  painLevels: TPainLevel[];
  physicalInformation: TClientPhysicalInformation;
  days: TClientProgramDay[];
  trainingDays: boolean[];
};

// Specific properties for each case
export type TClientProgramSpecific =
  | { physioProgramId: string; physioId: string }
  | {
      programId: string;
      conditionAssessmentAnswers: TConditionAssessmentAnswer[];
      phases: TPhase[];
    };

export type TConditionAssessmentAnswer = boolean | string;

/**
 * @memberof TPhysioClient
 * @memberof TClientProfile
 * @description Clients program data/progress from clients/users collection.
 * @path /clients/{clientId}/programs/{programId}
 * @param pid Program Id
 * @param programBy Euneo or Physio Id - this is not stored in database
 * @param outcomeMeasuresAnswers assessment of clients progress, physical condition every 4 weeks.
 * @param days prescripted program mapped to training days.
 * @param painLevels pain level of the client mapped to dates.
 * @param conditionAssessment Answers to program questions regarding client condition at start of program. //*Þetta er gamla general.
 * @param phases how many days in each phase of the program. (p1: 2, etc.)
 * @param trainingDays which days are training days. (monday: true, etc.)
 * @param physicalInformation physical information about the client. (height, weight, etc.) //* Þetta er gamla userInfo.
 *
 */
// Combine them
export type TClientProgram = TClientProgramSpecific & TClientProgramCommon;

// ! Omit properties

export type TClientProgramOmitted<T extends keyof TClientProgramCommon> =
  TClientProgramSpecific & Omit<TClientProgramCommon, T>;
