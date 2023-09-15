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

interface TProgramBase {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  days: Record<string, TProgramDay>;
}

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

type TProgramQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
};

// Specific Program Types
export interface TContinuousProgram extends TProgramBase {
  mode: "continuous";
}

export interface TPhaseProgram extends TProgramBase {
  mode: "phase";
  phases: Record<string, TProgramPhase>;
}

// Exported Types
export type TEuneoProgram = (TContinuousProgram | TPhaseProgram) & {
  programId: string;
  conditionAssessment: TProgramQuestion[];
};

export type TPhysioProgram = TContinuousProgram & {
  physioProgramId: string;
  physioId: string;
};

// Omitted Types
type OmitBaseProps<K extends keyof TProgramBase> = Omit<TProgramBase, K>;

type ProgramWithMode<
  K extends keyof TProgramBase,
  M extends TProgramMode
> = OmitBaseProps<K> & {
  mode: M;
};

export type TPhysioProgramOmitted<K extends keyof TProgramBase> =
  ProgramWithMode<K, "continuous"> & {
    physioProgramId: string;
    physioId: string;
  };

export type TEuneoProgramOmitted<K extends keyof TProgramBase> =
  ProgramWithMode<K, TProgramMode> & {
    programId: string;
    conditionAssessment: TProgramQuestion[];
  };
