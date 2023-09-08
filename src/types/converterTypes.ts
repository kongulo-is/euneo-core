import { Timestamp, DocumentReference } from "@firebase/firestore";
import {
  TConditionId,
  TProgramQuestion,
  TProgramMode,
  TPrescriptionStatus,
  TClientStatus,
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
  status?: TClientStatus;
  condition?: TConditionId;
  clientRef?: DocumentReference;
  prescription?: PrescriptionWrite;
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
