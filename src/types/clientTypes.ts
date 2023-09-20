/**
 * ! Þetta er ekki physioClient heldur client
 */

import { TConditionId, TOutcomeMeasureId } from "./baseTypes";

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

export type TClientStatus =
  | "Active"
  | "Not Started"
  | "Inactive"
  | "No Prescription";

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
  dayId: `d${number}`;
  phaseId?: string;
  date: Date;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

/** @memberof TClientProgram */
export type TPhase = { key: string; value: number };

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
export type TConditionAssessmentAnswer = boolean | string;

// ------------------------------

/**
 * @description This is the base for the client program
 */
export type TClientProgramBase = {
  conditionId: TConditionId;
  outcomeMeasuresAnswers: TOutcomeMeasureAnswers[];
  painLevels: TPainLevel[];
  physicalInformation: TClientPhysicalInformation;
  trainingDays: boolean[];
  conditionAssessmentAnswers?: TConditionAssessmentAnswer[];
  phases?: TPhase[];
};

/**
 * Everything between the base and read is specific to each type of program
 */
export type TClientEuneoProgramRead = TClientProgramBase & {
  euneoProgramId: string;
};

// Specific properties for each case
export type TClientPhysioProgramRead = TClientProgramBase & {
  physioProgramId: string;
  physioId: string;
};

export type TClientProgramRead =
  | TClientEuneoProgramRead
  | TClientPhysioProgramRead;

// * Here are types after converter

type TClientProgramId = {
  clientProgramId: string;
  days: TClientProgramDay[];
};

export type TClientPhysioProgram = TClientPhysioProgramRead & TClientProgramId;

export type TClientEuneoProgram = TClientEuneoProgramRead & TClientProgramId;

/**
 * @description this is the converted reference to the program
 * /clients/{clientId}/programs/{programId}
 * and the subcollection data
 * /clients/{clientId}/programs/{programId}/days/{dayId}
 */
export type TClientProgram = TClientPhysioProgram | TClientEuneoProgram;