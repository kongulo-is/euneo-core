import { DocumentReference } from "firebase/firestore";
import { TProgramDayKey } from "./programDay";

export type TNextPhase = {
  phaseId: TProgramPhaseKey;
  length?: number;
  maxPainLevel: number;
  minPainLevel: number;
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

export type TProgramPhaseBase = {
  days: TProgramDayKey[];
  name?: string;
  length?: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
  description?: string;
  mode: "finite" | "continuous" | "maintenance";
  hidden?: boolean; // For compatibility (old modified programs that have more than one continuous phase after upgrade)
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
