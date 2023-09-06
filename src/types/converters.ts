//TODO: Ætti þessi file að heita eitthvað annað? eins og t.d. writeTypes eða firebaseTypes?
import { DocumentReference, Timestamp } from "@firebase/firestore-types";
import { TConditionId, TStatus } from "./datatypes";

/**
 * @description client data as it is stored in the database in client collection
 * @path /clients/{clientId}
 */
export type ClientWrite = {
  name: string;
  gender: "male" | "female" | "other";
  platform: "android" | "ios";
  birthDate: Timestamp;
};

/**
 * @description physio invite to client.
 * @path /invitations/{invitationId}
 */
export type InvitationWrite = {
  code: string;
  physioClientRef: DocumentReference;
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
  status: TStatus;
};

/**
 * @description custom program data as it is stored in the database in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}
 */
export type PhysioProgramWrite = {
  name: string;
  condition: TConditionId; // TODO: breyta í conditionId?
  outcomeMeasures: DocumentReference[]; // TODO: breyta í outcomeMeasureRefs því þetta eru refs?
  mode: "continuous";
};

/**
 * @description custom day in subcollection days in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}/days/{dayId}
 */
export type PhysioProgramDayWrite = {
  exercises: ExerciseDayWrite[];
};

/**
 * @description exercise in custom day in subcollection days in program subcollection in physio collection
 * @path /physios/{physioId}/programs/{programId}/days/{dayId}/exercises/{exerciseId}
 */
export type ExerciseDayWrite = {
  reference: DocumentReference;
  quantity: number;
  sets: number;
  reps: number;
};
