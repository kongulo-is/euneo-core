import {
  collection,
  deleteField,
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Collection, TConditionId } from "../global";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";
import {
  TOutcomeMeasureAnswerWrite,
  TOutcomeMeasureAnswers,
} from "./outcomeMeasureAnswer";
import { TPainLevel, TPainLevelWrite } from "./painLevel";
import { TClientPhysicalInformation } from "./physicalInformation";
import { TPhase } from "./phase";
import {
  TClinicianClientIdentifiers,
  TClinicianClientRef,
  deserializeClinicianClientPath,
} from "../clinician/clinicianClient";
import { TConditionAssessmentAnswer } from "./conditionAssessmentAnswer";

import { isEmptyObject } from "../../utilities/basicHelpers";
import {
  TClinicianProgramVersionIdentifiers,
  TEuneoProgramVersionIdentifiers,
  TProgramVersionRef,
  deserializeProgramVersionPath,
} from "../program/version";
import { TClientProgramDay } from "./day";
import { db } from "../../firebase/db";

// Ref type
export type TClientProgramRef = DocumentReference<
  TClientProgramRead,
  TClientProgramWrite
>;

// Types Definitions
export type TClientProgramIdentifiers = {
  [Collection.Clients]: string;
  [Collection.Programs]: string;
};

// Write Type
export type TClientProgramWrite = {
  conditionId: TConditionId | null;
  outcomeMeasuresAnswers: Record<
    TOutcomeMeasureId,
    TOutcomeMeasureAnswerWrite[]
  > | null;
  painLevels: TPainLevelWrite[];
  physicalInformation: TClientPhysicalInformation;
  trainingDays: boolean[];
  conditionAssessmentAnswers?: TConditionAssessmentAnswer[];
  phases: TPhase[];
  clinicianClientRef?: TClinicianClientRef;
  completed?: boolean;
  shouldRefetch?: boolean;
  programVersionRef: TProgramVersionRef;
  /**
   * @deprecated use programVersionRef instead
   */
  programRef?: TProgramVersionRef;
};

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
  phases: TPhase[];
  completed?: boolean;
  shouldRefetch?: boolean;
};

// Define the common prescription fields
type PrescriptionFields = {
  clinicianClientRef: TClinicianClientRef;
  clinicianClientIdentifiers: TClinicianClientIdentifiers;
};

type TEuneoProgramVersion = {
  programVersionRef: TProgramVersionRef;
  programVersionIdentifiers: TEuneoProgramVersionIdentifiers;
};

type TClinicianProgramVersion = {
  programVersionRef: TProgramVersionRef;
  programVersionIdentifiers: TClinicianProgramVersionIdentifiers;
};

// Euneo with prescription
export type TClientProgram_EuneoWithPrescription_Read = TClientProgramBase &
  PrescriptionFields &
  TEuneoProgramVersion;

// Euneo without prescription
export type TClientProgram_EuneoWithoutPrescription_Read = TClientProgramBase &
  TEuneoProgramVersion;

export type TClientProgram_Euneo_Read =
  | TClientProgram_EuneoWithPrescription_Read
  | TClientProgram_EuneoWithoutPrescription_Read;

// Clinician with prescription
export type TClientProgram_ClinicianWithPrescription_Read = TClientProgramBase &
  PrescriptionFields &
  TClinicianProgramVersion;

// Clinician without prescription (never used)
// type TClientProgram_ClinicianWithoutPrescription_Read = TClientProgramBase &
//   TClinicianProgramVersion;

// Union type for all states
export type TClientProgramRead =
  | TClientProgram_Euneo_Read
  | TClientProgram_ClinicianWithPrescription_Read;

export type TClientProgram_Euneo = TClientProgram_Euneo_Read & {
  days: TClientProgramDay[];
  clientProgramRef: TClientProgramRef;
  clientProgramIdentifiers: TClientProgramIdentifiers;
};

export type TClientProgram_Clinician =
  TClientProgram_ClinicianWithPrescription_Read & {
    days: TClientProgramDay[];
    clientProgramRef: TClientProgramRef;
    clientProgramIdentifiers: TClientProgramIdentifiers;
  };

/**
 * @description this is the converted reference to the program
 * /clients/{clientId}/programs/{programId}
 * and the subcollection data
 * /clients/{clientId}/programs/{programId}/days/{dayId}
 */
export type TClientProgram = TClientProgram_Euneo | TClientProgram_Clinician;

// Serialization Functions
export function serializeClientProgramIdentifiers(
  obj: TClientProgramIdentifiers
): string {
  try {
    return `${Collection.Clients}/${obj.clients}/${Collection.Programs}/${obj.programs}`;
  } catch (error) {
    console.error("Error serializing client program identifiers: ", error);
    throw error;
  }
}

export function deserializeClientProgramPath(
  path: string
): TClientProgramIdentifiers {
  try {
    const [_clients, clientId, _programs, programId] = path.split("/");
    return {
      [Collection.Clients]: clientId,
      [Collection.Programs]: programId,
    };
  } catch (error) {
    console.error("Error deserializing client program path: ", error);
    throw error;
  }
}

export function createClientProgramRef({
  clients,
  programs,
}: {
  clients: string;
  programs?: string;
}): DocumentReference<TClientProgramRead, TClientProgramWrite> {
  const path = `${Collection.Clients}/${clients}/${Collection.Programs}`;
  const clientProgramsCollection = collection(db, path);

  const programRef = programs
    ? doc(clientProgramsCollection, programs).withConverter(
        clientProgramConverter
      )
    : doc(clientProgramsCollection).withConverter(clientProgramConverter);

  return programRef;
}

// Converter
export const clientProgramConverter = {
  toFirestore(program: TClientProgramRead): TClientProgramWrite {
    // Perform runtime checks
    // TODO: enable runtime checks?
    // runtimeChecks.assertTClientProgram(program, true); // Assertion done here if needed

    const outcomeMeasuresAnswers = {} as Record<
      TOutcomeMeasureId,
      TOutcomeMeasureAnswerWrite[]
    >;

    if (program.outcomeMeasuresAnswers) {
      Object.keys(program.outcomeMeasuresAnswers).forEach((measureId) => {
        const measureAnswers =
          program.outcomeMeasuresAnswers![measureId as TOutcomeMeasureId];
        outcomeMeasuresAnswers[measureId as TOutcomeMeasureId] =
          measureAnswers.map((answer) => ({
            ...answer,
            date: Timestamp.fromDate(answer.date),
          }));
      });
    }

    const painLevels = program.painLevels.map((pain) => ({
      ...pain,
      date: Timestamp.fromDate(pain.date),
    }));

    const data: TClientProgramWrite = {
      outcomeMeasuresAnswers,
      conditionId: program.conditionId,
      painLevels,
      programVersionRef: program.programVersionRef,
      trainingDays: program.trainingDays,
      physicalInformation: program.physicalInformation,
      phases: program.phases,
      ...("clinicianClientRef" in program && {
        clinicianClientRef: program.clinicianClientRef,
      }),
    };

    if ("conditionAssessmentAnswers" in program) {
      data["conditionAssessmentAnswers"] = program.conditionAssessmentAnswers;
    }

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientProgramWrite>,
    options: SnapshotOptions
  ): TClientProgramRead {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);
    let {
      programRef,
      painLevels,
      clinicianClientRef,
      programVersionRef,
      ...rest
    } = data;

    // convert timestamps to dates in outcomeMeasures and painLevels
    const outcomeMeasuresAnswers = {} as Record<
      TOutcomeMeasureId,
      TOutcomeMeasureAnswers[]
    > | null;
    if (
      data.outcomeMeasuresAnswers &&
      !isEmptyObject(data.outcomeMeasuresAnswers)
    ) {
      Object.keys(data.outcomeMeasuresAnswers)?.forEach((measureId) => {
        const measureAnswers =
          data.outcomeMeasuresAnswers![measureId as TOutcomeMeasureId];
        outcomeMeasuresAnswers![measureId as TOutcomeMeasureId] =
          measureAnswers.map((answer) => ({
            ...answer,
            date: answer.date.toDate(),
          }));
      });
    }

    const painLevelsClient: TPainLevel[] = painLevels.map((pain) => ({
      ...pain,
      date: pain.date.toDate(),
    }));

    // TODO: enable runtime checks?
    // runtimeChecks.assertTClientProgram(clientProgram, true);

    // TODO: remove this when all client programs are stable
    // https://www.notion.so/K-i-sem-m-ey-a-egar-stable-28f0c107f0a24b0693106f4992171392?pvs=4#b993e70051764bbbbba6fe6748f88e2b
    // This is done because deprecated client programs don't have a programVersionRef but a programRef
    if (programRef) {

      updateDoc(snapshot.ref.withConverter(clientProgramConverter), {
        programVersionRef: programRef,
        programRef: deleteField(),
      });
    }
    programVersionRef = programVersionRef || programRef;

    if (!programVersionRef) {
      throw new Error("Program version ref not found");
    }

    if (clinicianClientRef) {
      const clientProgram:
        | TClientProgram_ClinicianWithPrescription_Read
        | TClientProgram_EuneoWithPrescription_Read = {
        ...rest,
        painLevels: painLevelsClient,
        outcomeMeasuresAnswers,
        programVersionRef: programVersionRef,
        programVersionIdentifiers: deserializeProgramVersionPath(
          programVersionRef.path
        ),
        clinicianClientRef: clinicianClientRef,
        clinicianClientIdentifiers: deserializeClinicianClientPath(
          clinicianClientRef.path
        ),
      };
      return clientProgram;
    } else {
      const clientProgram: TClientProgram_EuneoWithoutPrescription_Read = {
        ...rest,
        painLevels: painLevelsClient,
        outcomeMeasuresAnswers,
        programVersionRef: programVersionRef,
        programVersionIdentifiers: deserializeProgramVersionPath(
          programVersionRef.path
        ),
      };
      return clientProgram;
    }
  },
};
