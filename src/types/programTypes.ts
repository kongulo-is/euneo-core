import { DocumentReference } from "firebase/firestore";
import {
  TConditionId,
  TEuneoProgramId,
  TOutcomeMeasureWrite,
} from "./baseTypes";
import { TOutcomeMeasureId } from "./physioTypes";

/**
 * @memberof TProgramDay
 * @description Exercise in a day in program collection. Either Euneo or custom program.
 * @param id Id of the exercise - ref in firebase
 */
export type TProgramDayExercise = {
  exerciseId: string;
  quantity: number;
  sets: number;
  reps: number;
};

export type TNextPhase = {
  phaseId: `p${number}`;
  length: number;
  maxPainLevel: number;
  minPainLevel: number;
};

export type TProgramDay = { exercises: TProgramDayExercise[] };

export type TProgramDayRead = TProgramDay;

// Common Types
export type TProgramMode = "continuous" | "phase";

export type TProgramPhaseBase = {
  days: `d${number}`[];
  length: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
  description?: string;
};

export type TProgramPhaseRead = TProgramPhaseBase;

export type TProgramPhase = TProgramPhaseRead;

export type TConditionAssessmentQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
};

// Specific Program Types
// export interface TContinuousProgram {
//   name: string;
//   conditionId: TConditionId;
//   outcomeMeasureIds?: TOutcomeMeasureId[];
//   days: Record<`d${number}`, TProgramDay>;
//   mode: "continuous";
// }

// export interface TPhaseProgram {
//   name: string;
//   conditionId: TConditionId;
//   days: Record<`d${number}`, TProgramDay>;
//   mode: "phase";
//   phases: Record<`p${number}`, TProgramPhase>;
//   outcomeMeasureIds?: TOutcomeMeasureId[];
//   conditionAssessment?: TProgramQuestion[];
// }

// Exported Types

export type TProgramBase = {
  name: string;
  mode: TProgramMode;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  conditionAssessment?: TConditionAssessmentQuestion[];
  conditionId: TConditionId | null;
};

export type TProgramRead = TProgramBase;

export type TContinuousProgram = TProgramRead & {
  days: Record<`d${number}`, TProgramDay>;
  mode: "continuous";
};

export type TPhaseProgram = TProgramRead & {
  days: Record<`d${number}`, TProgramDay>;
  phases: Record<`p${number}`, TProgramPhase>;
  mode: "phase";
};

export type TEuneoProgram = (TContinuousProgram | TPhaseProgram) & {
  euneoProgramId: TEuneoProgramId;
};

export type TPhysioProgram = TContinuousProgram & {
  physioProgramId: string;
  physioId: string;
};

export type TProgram = TEuneoProgram | TPhysioProgram;

//  ! Write types

/**
 * @description custom program data as it is stored in the database in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}
 */
export type TProgramWrite = {
  name: string;
  conditionId: TConditionId | null;
  outcomeMeasureRefs: DocumentReference<TOutcomeMeasureWrite>[]; // Always exists but might be empty
  conditionAssessment: TConditionAssessmentQuestion[]; // Always exists but might be empty
  mode: TProgramMode;
  version: string;
};

/**
 * @description custom day in subcollection days in program subcollection in physio or programs collection
 * @path /physios/{physioId}/programs/{programId}/days/{dayId}
 * @path /programs/{programId}/days/{dayId}
 */
export type TProgramDayWrite = {
  exercises: TExerciseDayWrite[];
};

/**
 * @description custom day in subcollection days in program subcollection in physio or programs collection
 * @path /physios/{physioId}/programs/{programId}/days/{dayId}
 * @path /programs/{programId}/days/{dayId}
 */
export type TProgramPhaseWrite = {
  days: DocumentReference[];
  length: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
};

/**
 * @description exercise in custom day in subcollection days in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}/days/{dayId}/exercises/{exerciseId}
 * @path /programs/{programId}/days/{dayId}/exercises/{exerciseId}
 */
export type TExerciseDayWrite = {
  reference: DocumentReference;
  quantity: number;
  sets: number;
  reps: number;
};
