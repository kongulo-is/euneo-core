import { TConditionId, TOutcomeMeasureId } from "./baseTypes";

/**
 * @memberof TProgramDay
 * @description Exercise in a day in program collection. Either Euneo or custom program.
 * @param id Id of the exercise - ref in firebase
 */
export type TProgramDayExercise = {
  exerciseId: string;
  quantity: number; //TODO: Er þetta bara notað fyrir seconds. Heita seconds?
  sets: number;
  reps: number;
};

export type TProgramDay = { exercises: TProgramDayExercise[] };

export type TProgramDayRead = TProgramDay;

// Common Types
export type TProgramMode = "continuous" | "phase";

type TProgramPhase = {
  phaseId: `p${number}`;
  days: `d${number}`[];
  length: number;
  nextPhase?: Array<{
    phaseId: `p${number}`;
    length: number;
    maxPainLevel: number;
    minPainLevel: number;
  }>;
};

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
  conditionId: TConditionId;
  mode: TProgramMode;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  conditionAssessment?: TConditionAssessmentQuestion[];
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
  euneoProgramId: string;
};

export type TPhysioProgram = TContinuousProgram & {
  physioProgramId: string;
  physioId: string;
};
