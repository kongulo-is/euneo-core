import {
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import {
  TProgramDayKey,
  TProgramDayRead,
  TProgramDayWrite,
} from "./programDay";

/**
 * @deprecated TODO: find a better way to do this
 */
export type TProgramPhaseKey = `p${number}` | `${string}_p${number}`;

export type TNextPhaseForm = {
  phaseId: TProgramPhaseKey;
  length?: number;
  maxPainLevel: number;
  minPainLevel: number;
};

export type TNextPhase = {
  reference: DocumentReference<TProgramPhaseWrite>;
  /**
   * @deprecated TODO: use reference
   */
  phaseId: TProgramPhaseKey;
  length?: number;
  maxPainLevel: number;
  minPainLevel: number;
};

// This type is used when the program is being created and the program id is not known
export type TProgramPhaseForm = {
  days: TProgramDayKey[];
  name?: string;
  length?: number;
  nextPhase?: TNextPhaseForm[];
  finalPhase: boolean;
  mode: "finite" | "continuous" | "maintenance";
  hidden?: boolean; // For compatibility (old modified programs that have more than one continuous phase after upgrade)
};

export type TProgramPhaseWrite = {
  days: DocumentReference<TProgramDayRead, TProgramDayWrite>[];
  name?: string;
  length?: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
  mode: "finite" | "continuous" | "maintenance";
};

export type TProgramPhaseBase = {
  /*
   * @deprecated TODO: remove this
   */
  daysDeprecated: TProgramDayKey[];
  days: DocumentReference<TProgramDayRead, TProgramDayWrite>[];
  name?: string;
  length?: number;
  nextPhase?: TNextPhase[];
  finalPhase: boolean;
  mode: "finite" | "continuous" | "maintenance";
  hidden?: boolean; // For compatibility (old modified programs that have more than one continuous phase after upgrade)
};

export type TProgramFinitePhaseRead = TProgramPhaseBase & {
  nextPhase: TNextPhase[];
  length: number;
  mode: "finite";
};

export type TProgramContinuousPhaseRead = TProgramPhaseBase & {
  mode: "continuous" | "maintenance";
};

export type TProgramPhaseRead =
  | TProgramFinitePhaseRead
  | TProgramContinuousPhaseRead;

export type TProgramPhase = TProgramPhaseRead;

function isFinitePhase(
  phase: TProgramPhaseBase,
): phase is TProgramFinitePhaseRead {
  return phase.mode === "finite" && phase.length !== undefined;
}

function isContinuousPhase(
  phase: TProgramPhaseBase,
): phase is TProgramContinuousPhaseRead {
  return phase.mode === "continuous" || phase.mode === "maintenance";
}

export const programPhaseConverter = {
  toFirestore(phase: TProgramPhaseRead): TProgramPhaseWrite {
    const { daysDeprecated, ...rest } = phase;

    return {
      ...rest,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramPhaseWrite>,
    options: SnapshotOptions,
  ): TProgramPhaseRead {
    const data = snapshot.data(options);

    const basePhase: TProgramPhaseBase = {
      ...data,
      daysDeprecated: data.days.map((day) => day.id as TProgramDayKey),
    };

    if (isFinitePhase(basePhase)) {
      return {
        ...basePhase,
        length: basePhase.length,
        mode: "finite",
      };
    } else if (isContinuousPhase(basePhase)) {
      return {
        ...basePhase,
        mode: basePhase.mode,
      };
    } else {
      throw new Error("Invalid program phase");
    }
  },
};
