/**
 * ! Þetta er ekki clinicianClient heldur client
 */

import { Timestamp, DocumentReference, DocumentData } from "firebase/firestore";
import {
  TConditionId,
  TEuneoReferenceIds,
  TPhysicalActivity,
  TClinicianReferenceIds,
} from "./baseTypes";
import { TProgramWrite } from "./programTypes";
import { TOutcomeMeasureId, TClinicianClientWrite } from "./clinicianTypes";

/**
 * @description Client data from client collection
 * @param platform ios or android
 * @param currentProgramId Id of the program the client is currently doing
 * @param programs Array of programs progress data from programs subcollection to client
 */
export type TClientRead = {
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  platform: "ios" | "android";
  preferences: TClientPreferences;
  currentProgramId?: string;
  programs?: { [key: string]: TClientProgram };
};

export type TClient = TClientRead & { clientId: string };

export type TClientPreferences = {
  reminders: {
    exercise?: {
      enabled: boolean;
      hour?: number;
      minute?: number;
    };
  };
  showCompletedExercises: boolean;
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
  outcomeMeasureId: TOutcomeMeasureId;
  // type: string | "foot&ankle";
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
  phaseId?: `p${number}`;
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
  physicalActivity: TPhysicalActivity;
};
// Answers are null when initialized
export type TConditionAssessmentAnswer = boolean | string;

// ------------------------------

/**
 * @description This is the base for the client program
 */
export type TClientProgramBase = {
  conditionId: TConditionId | null;
  outcomeMeasuresAnswers: Record<
    TOutcomeMeasureId,
    TOutcomeMeasureAnswers[]
  > | null;
  painLevels: TPainLevel[];
  physicalInformation: TClientPhysicalInformation;
  trainingDays: boolean[];
  conditionAssessmentAnswers?: TConditionAssessmentAnswer[];
  phases?: TPhase[];
};

/**
 * Everything between the base and read is specific to each type of program
 */
export type TClientEuneoProgramRead = TClientProgramBase & TEuneoReferenceIds;

// Specific properties for each case
export type TClientClinicianProgramRead = TClientProgramBase &
  TClinicianReferenceIds;

export type TClientProgramRead =
  | TClientEuneoProgramRead
  | TClientClinicianProgramRead;

// * Here are types after converter

type TClientProgramId = {
  clientProgramId: string;
  days: TClientProgramDay[];
};

export type TClientClinicianProgram = TClientClinicianProgramRead &
  TClientProgramId;

export type TClientEuneoProgram = TClientEuneoProgramRead & TClientProgramId;

/**
 * @description this is the converted reference to the program
 * /clients/{clientId}/programs/{programId}
 * and the subcollection data
 * /clients/{clientId}/programs/{programId}/days/{dayId}
 */
export type TClientProgram = TClientClinicianProgram | TClientEuneoProgram;

// ! Write types

/**
 * @description client data as it is stored in the database in client collection
 * @path /clients/{clientId}
 */
export type TClientWrite = {
  name: string;
  gender: "male" | "female" | "other";
  platform: "android" | "ios";
  birthDate: string;
  email?: string; // TODO: Erum við með ehv email?
  preferences: TClientPreferences;
  currentProgramRef?: DocumentReference;
};

export type TClientProgramDayWrite = {
  dayId: `d${number}`;
  phaseId?: string;
  date: Timestamp;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

export type TClientProgramWrite = {
  programRef: DocumentReference<TProgramWrite, DocumentData>;
  conditionId: TConditionId | null;
  outcomeMeasuresAnswers: Record<
    TOutcomeMeasureId,
    TOutcomeMeasureAnswerWrite[]
  > | null;
  painLevels: TPainLevelWrite[];
  conditionAssessmentAnswers?: Array<boolean | string>;
  trainingDays: boolean[];
  physicalInformation: TClientPhysicalInformation;
  phases?: TPhase[];
};

export type TOutcomeMeasureAnswerWrite = {
  date: Timestamp;
  outcomeMeasureId: TOutcomeMeasureId;
  // type: string | "foot&ankle";
  sections: TOutcomeMeasureAnswerSection[];
};

type TPainLevelWrite = {
  date: Timestamp;
  painIndex: number;
};
