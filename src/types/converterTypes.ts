import { Timestamp, DocumentReference } from "@firebase/firestore";
import { TConditionId, TExerciseType } from "./baseTypes";
import {
  TClientPhysicalInformation,
  TOutcomeMeasureAnswerSection,
  TPhase,
} from "./clientTypes";
import {
  TConditionAssessmentQuestion,
  TNextPhase,
  TProgramMode,
} from "./programTypes";
import { DocumentData } from "firebase/firestore";
import { TOutcomeMeasureId, TPrescriptionStatus } from "./physioTypes";

/**
 * @description client data as it is stored in the database in client collection
 * @path /clients/{clientId}
 */
export type ClientWrite = {
  name: string;
  gender: "male" | "female" | "other";
  platform: "android" | "ios";
  birthDate: string;
  email: string;
  currentProgramId?: string;
};

export type ClientProgramDayWrite = {
  dayId: `d${number}`;
  phaseId?: string;
  date: Timestamp;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

export type ClientProgramWrite = {
  programRef: DocumentReference<
    ContinuousProgramWrite | PhaseProgramWrite,
    DocumentData
  >;
  conditionId: TConditionId;
  outcomeMeasuresAnswers: OutcomeMeasureAnswerWrite[];
  painLevels: PainLevelWrite[];
  conditionAssessmentAnswers?: Array<boolean | string>;
  trainingDays: boolean[]; //TODO: ? Tékka hvort þetta sé einhverntíman ekki sett í gagnagrunninn.
  physicalInformation: TClientPhysicalInformation;
  phases?: TPhase[];
};

type OutcomeMeasureAnswerWrite = {
  date: Timestamp;
  name: TOutcomeMeasureId;
  type: string | "foot&ankle";
  sections: TOutcomeMeasureAnswerSection[];
};

type PainLevelWrite = {
  date: Timestamp;
  painIndex: number;
};

/**
 * @description physio invite to client.
 * @path /invitations/{invitationId}
 */
export type InvitationWrite = {
  code: string;
  physioClientRef: DocumentReference<PhysioClientWrite>;
};

/**
 * @description physio data as it is stored in the database in physio collection
 * @path /physios/{physioId}
 */
export type PhysioWrite = {
  email: string;
  name: string;
};

/**
 * @description physio client data as it is stored in client subcollection in physio collection
 * @path /physios/{physioId}/clients/{physioClientId}
 */
export type PhysioClientWrite = {
  name: string;
  email: string;
  conditionId: TConditionId | null;
  clientRef?: DocumentReference;
  prescription?: PrescriptionWrite;
  // status?: TClientStatus; //* Ekki geymt í firestore
};

/**
 * @description prescription data as it is stored in client subcollection in physio collection
 * @path /physios/{physioId}/clients/{physioClientId}
 */
export type PrescriptionWrite = {
  programRef: DocumentReference;
  prescriptionDate: Timestamp;
  status: TPrescriptionStatus;
};

/**
 * @description custom program data as it is stored in the database in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}
 */
export type ProgramWrite = {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureRefs: DocumentReference[]; // Always exists but might be empty
  conditionAssessment: TConditionAssessmentQuestion[]; // Always exists but might be empty
  mode: TProgramMode;
  version: string;
};

/**
 * @description custom program data as it is stored in the database in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}
 */
export type PhaseProgramWrite = {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureRefs: DocumentReference[];
  conditionAssessment?: TConditionAssessmentQuestion[];
  mode: "phase";
  version: string;
};

/**
 * @description custom program data as it is stored in the database in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}
 */
export type ContinuousProgramWrite = {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureRefs: DocumentReference[];
  mode: "continuous";
};

/**
 * @description custom day in subcollection days in program subcollection in physio or programs collection
 * @path /physios/{physioId}/programs/{programId}/days/{dayId}
 * @path /programs/{programId}/days/{dayId}
 */
export type ProgramDayWrite = {
  exercises: ExerciseDayWrite[];
};

/**
 * @description custom day in subcollection days in program subcollection in physio or programs collection
 * @path /physios/{physioId}/programs/{programId}/days/{dayId}
 * @path /programs/{programId}/days/{dayId}
 */
export type ProgramPhaseWrite = {
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
export type ExerciseDayWrite = {
  reference: DocumentReference;
  quantity: number;
  sets: number;
  reps: number;
};

export type ExerciseWrite = {
  description: string;
  name: string;
  steps: string[];
  tips: string[];
  videoLink: {
    displayID: string;
    assetID: string;
  };
  type: TExerciseType;
};
