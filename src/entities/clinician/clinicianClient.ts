import { TConditionId } from "@/types/baseTypes";
import { TPrescription, TPrescriptionWrite } from "./prescription";
import { Timestamp } from "firebase/firestore";

export type TClientStatus =
  | "Active"
  | "Invited"
  | "Inactive"
  | "No prescription";

export type TClinicianClientBase = {
  name: string;
  email: string;
  date: Date;
  conditionId: TConditionId | null; // TODO: this no longer exists right?
  prescription?: TPrescription;
};

export type TClinicianClientRead = TClinicianClientBase;

export type TClinicianClientWrite = {
  name: string;
  email: string;
  date: Timestamp;
  conditionId: TConditionId | null;
  prescription?: TPrescriptionWrite;
};

export type TClinicianClient = TClinicianClientBase & {
  clinicianClientId: string;
  status?: TClientStatus;
  clientProgram?: TClientProgram;
};
