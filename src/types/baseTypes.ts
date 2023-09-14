import { TClientProgram } from "./clientTypes";

/**
 * @description Physician data type
 */
export type TPhysio = {
  email: string;
  name: string;
};

/**
 * @description Client information for the physician
 * @param name Name of the client given by the physician
 * @param email Email of the client
 * @param conditionId Id of the condition
 * @param prescription Prescription given to the client
 * @param clientId Id of the client in client collection after client has accepted the prescription
 * @param program clients program data/progress form client collection. (progress, days, pain levels, etc.)
 * @param status Status of the client (Active, Not Started, Inactive, No Prescription)
 */
export type TPhysioClient = {
  physioClientId: string;
  name: string;
  email: string;
  conditionId?: TConditionId;
  status?: TClientStatus;
  prescription?: TPrescription;
  clientId?: string;
  program?: TClientProgram;
};

// TODO: það þarf að hugsa þetta með progamId. Það gengur ekki upp með custom programs ef á að sækja beint í gagnagrunn.
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

/** @memberof TPrescription */
export type TPrescriptionStatus = "Invited" | "Accepted" | "Started";

/** @memberof TClientProgram */
export type TPhase = { key: string; value: number };

/** @memberof TOutcomeMeasureAnswers */
export type TOutcomeMeasureId = "faam" | "sf-36" | "visa-a" | "promis";

/**
 * @description Program data from program collection
 */
export type TProgramPath =
  | `programs/${string}`
  | `physios/${string}/programs/${string}`;

/** @memberof TProgram */
export type TProgramDay = { exercises: TProgramDayExercise[] };

/**
 * @memberof TProgramDay
 * @description Exercise in a day in program collection. Either Euneo or custom program.
 * @param id Id of the exercise - ref in firebase
 */
export type TProgramDayExercise = {
  exerciseId: string;
  quantity: number; //TODO: Er þetta bara notað fyrir seconds. Heita seconds?
  sets: number;
  reps: number;
};

// Component types
// export type TOption = {
//   value: string;
//   label: string;
// };

// export type TChartPoint = {
//   day: Date;
//   value: number;
// };

// export type TBarChartPoint = {
//   day: Date;
//   sections: {
//     type: string;
//     value: number;
//   }[];
// };

export type TClientStatus =
  | "Active"
  | "Not Started"
  | "Inactive"
  | "No Prescription";

/**
 * @description Exercise in exercise collection
 * @param steps Instructions for the exercise
 * @param tips Tips for the exercise
 * @param displayID url video
 * @param assetID id of video in mux
 */
export type TExercise = {
  id: string;
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

export type TExerciseType = "Stretch" | "Strength" | "Release" | "Other";

export type TConditionId =
  | "plantar-heel-pain"
  | "acl-treatment"
  | "pulled-hamstring"
  | "calf-injury"
  | "hip-replacement"
  | "dislocated-shoulder"
  | "post-surgery"
  | "ankle-sprain"
  | "knee-replacement"
  | "achilles-tendonitis"
  | "no-condition";

export type TEuneoProgramId = "plantar-heel-pain";

// !Client --------------------------------
