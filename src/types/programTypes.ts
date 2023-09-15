import {
  TConditionId,
  TOutcomeMeasureId,
  TProgramDay,
  TPhase,
} from "./baseTypes";

/**
 * @memberof TProgram
 * @description Euneo program questions about the client condition
 */
export type TProgramQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
};

export type TProgramPhase = {
  phaseId: `p${number}`;
  days: `d${number}`[];
  length: number;
  nextPhase?: {
    phaseId: `p${number}`;
    length: number;
    maxPainLevel: number;
    minPainLevel: number;
  }[];
};

export type TProgramMode = "continuous" | "phase";

/**
 * @description Euneo or custom program created by Physio
 * @param outcomeMeasureIds Ids of outcome measures used to track client progress every 4 weeks.
 * @param days exercises each day in program (d1, d2, etc.) with ref to exercise and sets, reps, seconds.
 */
type TProgramBase = {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureIds?: TOutcomeMeasureId[];
  // TODO: ræða hvort days eigi að vera hér inni eða ekki.
  days: { [key: string]: TProgramDay };
};

export type TContinuousProgram = TProgramBase & {
  mode: "continuous";
};

export type TPhaseProgram = TProgramBase & {
  mode: "phase";
  phases: { [key: string]: TProgramPhase };
};

/**
 * @param conditionAssessment Only used in Euneo programs. Questions about the client condition to create phases and days in program.
 */
export type TEuneoProgram = (TContinuousProgram | TPhaseProgram) & {
  programId: string;
  conditionAssessment: TProgramQuestion[]; //* Það er ekki conditionAssessments því þetta er bara 1 assessment
  // createdBy: "Euneo"; // ? sjáum hvort við þurfum þetta eða ekki
};

export type TPhysioProgram = TContinuousProgram & {
  // TODO: docId verður að physioProgramId
  physioProgramId: string;
  // TODO: hér bætti ég við physioId
  physioId: string;
  // createdBy: "Physio";
};

// ! Ommited properties

type OmitProps<T, K extends keyof T> = Omit<T, K>;

type TProgramBaseOmitted<K extends keyof TProgramBase> = OmitProps<
  TProgramBase,
  K
>;

export type TContinuousProgramOmitted<K extends keyof TProgramBase> = OmitProps<
  TContinuousProgram,
  K
>;

type TProgramWithMode<
  K extends keyof TProgramBase,
  Mode extends string
> = TProgramBaseOmitted<K> & {
  mode: Mode;
};

export type TPhysioProgramOmitted<K extends keyof TProgramBase> =
  TProgramWithMode<K, "continuous"> & {
    physioProgramId: string;
    physioId: string;
  };

type TProgramWithEuneo<
  K extends keyof TProgramBase,
  Mode extends string
> = TProgramBaseOmitted<K> & {
  mode: Mode;
  programId: string;
  conditionAssessment: TProgramQuestion[];
};

export type TEuneoProgramOmitted<K extends keyof TProgramBase> =
  TProgramWithEuneo<K, "continuous" | "phase">;
