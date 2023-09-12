import { Timestamp, DocumentReference } from "@firebase/firestore";
import {
  TConditionId,
  TProgramQuestion,
  TProgramMode,
  TPrescriptionStatus,
  TClientStatus,
  TOutcomeMeasureAnswer,
  TPainLevel,
  TPhase,
  TClientPhysicalInformation,
  TOutcomeMeasureAnswerSection,
  TOutcomeMeasureId,
} from "./datatypes";

/**
 * @description client data as it is stored in the database in client collection
 * @path /clients/{clientId}
 */
export type ClientWrite = {
  name: string;
  gender: "male" | "female" | "other";
  platform: "android" | "ios";
  birthDate: Timestamp;
  email: string;
  currentProgramId?: string;
};

export type ClientProgramDayWrite = {
  dayId: string;
  phaseId?: string;
  date: Timestamp;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

export type ClientProgramWrite = {
  programRef: DocumentReference;
  conditionId: TConditionId;
  outcomeMeasuresAnswers: OutcomeMeasureAnswerWrite[];
  painLevel: PainLevelWrite[];
  conditionAssessmentAnswers?: Array<boolean | string>;
  phases?: TPhase[];
  trainingDays?: boolean[]; //TODO: ? Tékka hvort þetta sé einhverntíman ekki sett í gagnagrunninn.
  physicalInformation?: TClientPhysicalInformation;
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
  conditionId?: TConditionId;
  clientRef?: DocumentReference;
  prescription?: PrescriptionWrite;
  // status?: TClientStatus; //* Ekki geymt í firestore
};

/**
 * @description prescription data as it is stored in client subcollection in physio collection
 * @path /physios/{physioId}/clients/{physioClientId}
 */
export type PrescriptionWrite = {
  programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>;
  prescriptionDate: Timestamp;
  status: TPrescriptionStatus;
};

/**
 * @description custom program data as it is stored in the database in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}
 */
export type EuneoProgramWrite = {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureRefs: DocumentReference[];
  conditionAssessment: TProgramQuestion[];
  mode: TProgramMode;
  version: string;
};

/**
 * @description custom program data as it is stored in the database in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}
 */
export type PhysioProgramWrite = {
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
