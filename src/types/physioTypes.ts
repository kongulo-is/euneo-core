import { DocumentReference, Timestamp } from "firebase/firestore";
import { TConditionId } from "./baseTypes";
import { TClientProgram, TClientStatus } from "./clientTypes";
import { TPhysioProgram, TProgramWrite } from "./programTypes";

/** @memberof TPrescription */
export type TPrescriptionStatus = "Invited" | "Accepted" | "Started";

/**
 * @memberof TPhysioClient
 * @description Prescription given to the client by physio
 * @param programId Id of the program (custom or euneo)
 * @param status Status of the invitation to client. (Invited, Accepted, Started)
 * @param programBy Euneo or Physio - is not in database
 */
export type TPrescription = {
  programId: string;
  programBy?: "Euneo" | "Physio"; //? bæta þessu við?
  prescriptionDate: Date;
  status: TPrescriptionStatus;
};

/**
 * @description Physician data type
 */
export type TPhysio = {
  email: string;
  name: string;
};

/**
 * @description Client info for the physio. Base: stored in firebase.
 * @param prescription Prescription given to the client
 * @param clientId Id of the client in client collection after client has accepted the prescription.
 */
export type TPhysioClientBase = {
  name: string;
  email: string;
  conditionId?: TConditionId;
  clientId?: string;
  prescription?: TPrescription;
};

export type TPhysioClientRead = TPhysioClientBase;

/**
 * @description Client info for the physio.
 * @param physioClientId Id of the client in physio collection.
 * @param status Status of the client (Active, Not Started, Inactive, No Prescription) (not stored in firebase).
 * @param clientProgram clients program data/progress form client collection. (progress, days, pain levels, etc.)
 */
export type TPhysioClient = TPhysioClientBase & {
  physioClientId: string;
  status?: TClientStatus;
  clientProgram?: TClientProgram;
};

// ! Write types

/**
 * @description physio invite to client.
 * @path /invitations/{invitationId}
 */
export type TInvitationWrite = {
  code: string;
  physioClientRef: DocumentReference<TPhysioClientWrite>;
};

/**
 * @description physio data as it is stored in the database in physio collection
 * @path /physios/{physioId}
 */
export type TPhysioWrite = {
  email: string;
  name: string;
};

/**
 * @description physio client data as it is stored in client subcollection in physio collection
 * @path /physios/{physioId}/clients/{physioClientId}
 */
export type TPhysioClientWrite = {
  name: string;
  email: string;
  conditionId?: TConditionId;
  clientRef?: DocumentReference;
  prescription?: TPrescriptionWrite;
  // status?: TClientStatus; //* Ekki geymt í firestore
};

/**
 * @description prescription data as it is stored in client subcollection in physio collection
 * @path /physios/{physioId}/clients/{physioClientId}
 */
export type TPrescriptionWrite = {
  programRef: DocumentReference<TProgramWrite>; // TODO: add reference type
  prescriptionDate: Timestamp;
  status: TPrescriptionStatus;
};
