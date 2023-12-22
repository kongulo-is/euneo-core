import { DocumentReference, Timestamp } from "firebase/firestore";
import {
  TConditionId,
  TEuneoReferenceIds,
  TClinicianReferenceIds,
} from "./baseTypes";
import {
  TClientProgram,
  TClientProgramWrite,
  TClientStatus,
} from "./clientTypes";
import { TProgramWrite } from "./programTypes";

/** @memberof TPrescription */
export type TPrescriptionStatus = "Invited" | "Accepted" | "Started";

export type TPrescriptionBase = {
  prescriptionDate: Date;
  status: TPrescriptionStatus;
  clientProgramId?: string;
  clientId?: string;
};

export type TEuneoPrescription = TPrescriptionBase & TEuneoReferenceIds;

export type TClinicianPrescription = TPrescriptionBase & TClinicianReferenceIds;
export type TPrescription = TEuneoPrescription | TClinicianPrescription;

export type TOutcomeMeasureId = "faam" | "sf-36" | "visa-a" | "promis" | "pgq";

/**
 * @description Physician data type
 */
export type TClinician = {
  email: string;
  name: string;
  isAdmin?: boolean;
};

/**
 * @description Client info for the clinician. Base: stored in firebase.
 * @param prescription Prescription given to the client
 * @param clientId Id of the client in client collection after client has accepted the prescription.
 */
export type TClinicianClientBase = {
  name: string;
  email: string;
  date: Date;
  conditionId: TConditionId | null;
  prescription?: TPrescription;
};

export type TClinicianClientRead = TClinicianClientBase;

/**
 * @description Client info for the clinician.
 * @param clinicianClientId Id of the client in clinician collection.
 * @param status Status of the client (Active, Not Started, Inactive, No Prescription) (not stored in firebase).
 * @param clientProgram clients program data/progress form client collection. (progress, days, pain levels, etc.)
 */
export type TClinicianClient = TClinicianClientBase & {
  clinicianClientId: string;
  status?: TClientStatus;
  clientProgram?: TClientProgram;
};

// ! Write types

/**
 * @description clinician invite to client.
 * @path /invitations/{invitationId}
 */
export type TInvitationWrite = {
  code: string;
  clinicianClientRef: DocumentReference<TClinicianClientWrite>;
  date: Timestamp;
};

export type TInvitation = {
  code: string;
  date: Date;
};

/**
 * @description clinician data as it is stored in the database in clinician collection
 * @path /clinicians/{clinicianId}
 */
export type TClinicianWrite = {
  email: string;
  name: string;
};

/**
 * @description clinician client data as it is stored in client subcollection in clinician collection
 * @path /clinicians/{clinicianId}/clients/{clinicianClientId}
 */
export type TClinicianClientWrite = {
  name: string;
  email: string;
  date: Timestamp;
  conditionId: TConditionId | null;
  prescription?: TPrescriptionWrite;
};

/**
 * @description prescription data as it is stored in client subcollection in clinician collection
 * @path /clinicians/{clinicianId}/clients/{clinicianClientId}
 */
export type TPrescriptionWrite = {
  clientProgramRef?: DocumentReference<TClientProgramWrite>;
  programRef: DocumentReference<TProgramWrite>;
  prescriptionDate: Timestamp;
  status: TPrescriptionStatus;
};
