import { TConditionId, TPrescription } from "./baseTypes";
import { TClientProgram, TClientStatus } from "./clientTypes";

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
  prescription?: TPrescription;
  clientId?: string;
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
