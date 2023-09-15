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

// Common Types
type TProgramMode = "continuous" | "phase";

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

export type TProgramQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
};

// Specific Program Types
export interface TContinuousProgram {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  days: Record<`d${number}`, TProgramDay>;
  mode: "continuous";
}

export interface TPhaseProgram {
  name: string;
  conditionId: TConditionId;
  days: Record<`d${number}`, TProgramDay>;
  mode: "phase";
  phases: Record<`p${number}`, TProgramPhase>;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  conditionAssessment?: TProgramQuestion[];
}

// Exported Types
export type TEuneoProgram = (TContinuousProgram | TPhaseProgram) & {
  programId: string;
};

export type TPhysioProgram = TContinuousProgram & {
  physioProgramId: string;
  physioId: string;
};
