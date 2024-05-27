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
  phaseId: TProgramPhaseKey;
  length?: number;
  maxPainLevel: number;
  minPainLevel: number;
};

export type TProgramDay = { exercises: TProgramDayExercise[] };

export type TProgramDayRead = TProgramDay;

// Common Types
export type TProgramDayKey = `d${number}` | `${string}_d${number}`;

export type TProgramPhaseBase = {
  days: TProgramDayKey[];
  name?: string;
  length?: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
  description?: string;
  mode: "finite" | "continuous" | "maintenance";
  // // New fields
  // name: string;
  // phaseNumber: number;
  // clinicianClientId?: string;
  // version?: number;
};
export type TProgramFinitePhase = TProgramPhaseBase & {
  length: number;
  mode: "finite";
};

export type TProgramContinuousPhase = TProgramPhaseBase & {
  mode: "continuous" | "maintenance";
};

export type TProgramPhaseRead = (
  | TProgramFinitePhase
  | TProgramContinuousPhase
) & {
  programId: string;
  clinicianId?: string;
  version: string;
};
export type TProgramPhaseKey = `p${number}` | `${string}_p${number}`;

export type TProgramPhase = TProgramPhaseRead;

export type TConditionAssessmentQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
  initialPhases?: { phaseId: TProgramPhaseKey; length?: number }[];
};

// Exported Types

export type TProgramBase = {
  name?: string;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  conditionAssessment?: TConditionAssessmentQuestion[];
  conditionId: TConditionId | null;
  isLive?: boolean;
  isConsoleLive?: boolean;
  variation?: string;
  version: string;
  isSaved?: boolean;
};

export type TProgramRead = TProgramBase;

export type TProgramWithSubCollections = TProgramRead & {
  days: Record<TProgramDayKey, TProgramDay>;
  phases: Record<TProgramPhaseKey, TProgramPhase>;
};

export type TEuneoProgram = TProgramWithSubCollections & {
  euneoProgramId: TEuneoProgramId;
};

export type TClinicianProgram = TProgramWithSubCollections & {
  clinicianProgramId: string;
  clinicianId: string;
  isArchived?: boolean;
};

export type TProgramVersion = TProgramVersionRead;

export type TProgramVersionRead = {
  clinicianId: string;
  programId: string;
  currentVersion: string; // version id
};

export type TProgramVersionWrite = {
  currentVersion: DocumentReference<TProgramWrite>;
  isConsoleLive?: boolean;
  isLive?: boolean;
};

export type TProgram = TEuneoProgram | TClinicianProgram;

//  ! Write types

/**
 * @description custom program data as it is stored in the database in program subcollection in clinician collection
 * @path /clinicians/{clinicianId}/programs/{programId}
 */
export type TProgramWrite = {
  name?: string;
  conditionId: TConditionId | null;
  outcomeMeasureRefs: DocumentReference<TOutcomeMeasureWrite>[]; // Always exists but might be empty
  conditionAssessment: TConditionAssessmentQuestion[]; // Always exists but might be empty
  variation?: string;
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
  name?: string;
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
