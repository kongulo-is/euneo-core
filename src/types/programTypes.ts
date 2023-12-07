import { DocumentReference } from "firebase/firestore";
import {
  TConditionId,
  TEuneoProgramId,
  TOutcomeMeasureWrite,
} from "./baseTypes";
import { TOutcomeMeasureId } from "./clinicianTypes";

/**
 * @memberof TProgramDay
 * @description Exercise in a day in program collection. Either Euneo or custom program.
 * @param id Id of the exercise - ref in firebase
 */
export type TProgramDayExercise = {
  exerciseId: string;
  time: number;
  sets: number;
  reps: number;
};

export type TNextPhase = {
  phaseId: `p${number}`;
  length?: number;
  maxPainLevel: number;
  minPainLevel: number;
};

export type TProgramDay = { exercises: TProgramDayExercise[] };

export type TProgramDayRead = TProgramDay;

// Common Types

export type TProgramPhaseBase = {
  days: `d${number}`[];
  length?: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
  description?: string;
  mode: "finite" | "continuous" | "maintenance";
};
export type TProgramFinitePhase = TProgramPhaseBase & {
  length: number;
  mode: "finite";
};

export type TProgramContinuousPhase = TProgramPhaseBase & {
  mode: "continuous" | "maintenance";
};

export type TProgramPhaseRead = TProgramFinitePhase | TProgramContinuousPhase;

export type TProgramPhase = TProgramPhaseRead;

export type TConditionAssessmentQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
  initialPhase?: string[];
};

// Exported Types

export type TProgramBase = {
  name: string;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  conditionAssessment?: TConditionAssessmentQuestion[];
  conditionId: TConditionId | null;
  isLive?: boolean;
};

export type TProgramRead = TProgramBase;

export type TProgramWithSubCollections = TProgramRead & {
  days: Record<`d${number}`, TProgramDay>;
  phases: Record<`p${number}`, TProgramPhase>;
};

export type TEuneoProgram = TProgramWithSubCollections & {
  euneoProgramId: TEuneoProgramId;
  version?: string;
};

export type TClinicianProgram = TProgramWithSubCollections & {
  clinicianProgramId: string;
  clinicianId: string;
};

export type TProgram = TEuneoProgram | TClinicianProgram;

//  ! Write types

/**
 * @description custom program data as it is stored in the database in program subcollection in clinician collection
 * @path /clinicians/{clinicianId}/programs/{programId}
 */
export type TProgramWrite = {
  name: string;
  conditionId: TConditionId | null;
  outcomeMeasureRefs: DocumentReference<TOutcomeMeasureWrite>[]; // Always exists but might be empty
  conditionAssessment: TConditionAssessmentQuestion[]; // Always exists but might be empty
  version: string;
};

/**
 * @description custom day in subcollection days in program subcollection in clinician or programs collection
 * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}
 * @path /programs/{programId}/days/{dayId}
 */
export type TProgramDayWrite = {
  exercises: TExerciseDayWrite[];
};

/**
 * @description custom day in subcollection days in program subcollection in clinician or programs collection
 * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}
 * @path /programs/{programId}/days/{dayId}
 */
export type TProgramPhaseWrite = {
  days: DocumentReference[];
  length?: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
  description?: string;
  mode: "finite" | "continuous" | "maintenance";
};

/**
 * @description exercise in custom day in subcollection days in program subcollection in clinician collection
 * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}/exercises/{exerciseId}
 * @path /programs/{programId}/days/{dayId}/exercises/{exerciseId}
 */
export type TExerciseDayWrite = {
  reference: DocumentReference;
  time: number;
  sets: number;
  reps: number;
};
