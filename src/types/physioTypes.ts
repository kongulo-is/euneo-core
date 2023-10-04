import { DocumentReference, Timestamp } from "firebase/firestore";
import {
  TConditionId,
  TEuneoReferenceIds,
  TPhysioReferenceIds,
} from "./baseTypes";
import { TClientProgram, TClientStatus } from "./clientTypes";
import { TProgramWrite } from "./programTypes";

/** @memberof TPrescription */
export type TPrescriptionStatus = "Invited" | "Accepted" | "Started";

export type TPrescriptionBase = {
  prescriptionDate: Date;
  status: TPrescriptionStatus;
};

export type TEuneoPrescription = TPrescriptionBase & TEuneoReferenceIds;

export type TPhysioPrescription = TPrescriptionBase & TPhysioReferenceIds;
export type TPrescription = TEuneoPrescription | TPhysioPrescription;

export type TOutcomeMeasureId = "faam" | "sf-36" | "visa-a" | "promis" | "pgq";

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
  date: Date;
  conditionId: TConditionId | null;
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
  date: Timestamp;
  conditionId: TConditionId | null;
  clientRef?: DocumentReference;
  prescription?: TPrescriptionWrite;
  // status?: TClientStatus; //* Ekki geymt í firestore
};

/**
 * @description prescription data as it is stored in client subcollection in physio collection
 * @path /physios/{physioId}/clients/{physioClientId}
 */
export type TPrescriptionWrite = {
  programRef: DocumentReference<TProgramWrite>;
  prescriptionDate: Timestamp;
  status: TPrescriptionStatus;
};
