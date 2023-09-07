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

/**
 * @memberof TPhysioClient
 * @memberof TClientProfile
 * @description Clients program data/progress from clients/users collection.
 * @path /clients/{clientId}/programs/{programId}
 * @param pid Program Id
 * @param programBy Euneo or Physio Id - this is not stored in database
 * @param outcomeMeasuresAnswers assessment of clients progress, physical condition every 4 weeks.
 * @param days prescripted program mapped to training days.
 * @param painLevel pain level of the client mapped to dates.
 * @param conditionAssessment Answers to program questions regarding client condition at start of program. //*Þetta er gamla general.
 * @param phases how many days in each phase of the program. (p1: 2, etc.)
 * @param trainingDays which days are training days. (monday: true, etc.)
 * @param physicalInformation physical information about the client. (height, weight, etc.) //* Þetta er gamla userInfo.
 *
 */
export type TClientProgram = {
  pid: string;
  programBy: "Euneo" | string; //? bæta þessu við? string: physioId
  conditionId: TConditionId;
  outcomeMeasuresAnswers: TOutcomeMeasureAnswer[];
  painLevel: TPainLevel[];
  days: TClientProgramDay[];
  conditionAssessmentAnswers?: Array<boolean | string>;
  phases?: TPhase[];
  trainingDays?: boolean[]; //TODO: ? Tékka hvort þetta sé einhverntíman ekki sett í gagnagrunninn.
  physicalInformation?: TClientPhysicalInformation;
};
/**
 * @memberof TClientProgram
 * @description Physical information about the client
 * */
export type TClientPhysicalInformation = {
  athlete: boolean;
  height: number;
  weight: number;
  unit: "metric" | "imperial";
  physicalActivity: "None" | "Low" | "Moderate" | "High";
};

/** @memberof TClientProgram */
export type TPhase = { key: string; value: number };

/**
 * @memberof TClientProgram
 * @description Each day in clients program, progress. (date, adherence, restDay, etc.)
 * @param id (d1, d2, d3...)
 * @param phaseId (p1, p2, p3...)
 * @param adherence 0-100%
 * @param exercises array completed exercises in a day (0 = not completed, 1 = completed)
 */
export type TClientProgramDay = {
  id: string;
  phaseId: string;
  date: Date;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

/**
 * @memberof TClientProgram
 * @description Assessment of client during program.
 * @param name (FAAM, SF-36, VISA-A, PROMIS,...)
 */
export type TOutcomeMeasureAnswer = {
  date: Date;
  name: TOutcomeMeasureId;
  type: string | "foot&ankle"; //TODO: what is dis?
  sections: TOutcomeMeasureAnswerSection[];
};

/**
 * @memberof TOutcomeMeasureAnswer
 * @description Assessment result and answers.
 * @param score 0-100%
 * @param answers array of answeres to questions (0-4)
 */
export type TOutcomeMeasureAnswerSection = {
  score: number;
  answers?: number[];
};

/** @memberof TOutcomeMeasureAnswer */
export type TOutcomeMeasureId = "faam" | "sf-36" | "visa-a" | "promis";

/**
 * @description Program data from program collection
 */
export type TProgramPath =
  | `programs/${string}`
  | `physios/${string}/programs/${string}`;

/**
 * @description Euneo or custom program created by Physio
 * @param outcomeMeasureIds Ids of outcome measures used to track client progress every 4 weeks.
 * @param days exercises each day in program (d1, d2, etc.) with ref to exercise and sets, reps, seconds.
 */
type TProgramBase = {
  name: string;
  conditionId: TConditionId;
  outcomeMeasureIds: TOutcomeMeasureId[];
  // TODO: ræða hvort days eigi að vera hér inni eða ekki.
  days: TProgramDay[];
  // programPath: TProgramPath // * "programs/plantar-heel-pain" or "physios/physio1/programs/plantar-heel-pain"
};

type TContinuousProgram = TProgramBase & {
  mode: "continuous";
};

type TPhaseProgram = TProgramBase & {
  mode: "phase";
  phases: TPhase[];
};

/**
 * @param conditionAssessment Only used in Euneo programs. Questions about the client condition to create phases and days in program.
 */
export type TEuneoProgram = (TContinuousProgram | TPhaseProgram) & {
  programId: string;
  conditionAssessment: TProgramQuestion[]; //* Það er ekki conditionAssessments því þetta er bara 1 assessment
  // createdBy: "Euneo"; // ? sjáum hvort við þurfum þetta eða ekki
};

export type TPhysioProgram = TContinuousProgram & {
  // TODO: docId verður að physioProgramId
  physioProgramId: string;
  // TODO: hér bætti ég við physioId
  physioId: string;
  // createdBy: "Physio";
};

/** @memberof TProgram */
export type TProgramDay = { key: string; exercises: TExerciseDay[] };

/**
 * @memberof TProgramDay
 * @description Exercise in a day in program collection. Either Euneo or custom program.
 * @param id Id of the exercise - ref in firebase
 */
export type TExerciseDay = {
  id: string;
  quantity: number; //TODO: Er þetta bara notað fyrir seconds. Heita seconds?
  sets: number;
  reps: number;
};

export type TProgramMode = "continuous" | "phase";

/**
 * @memberof TProgram
 * @description Euneo program questions about the client condition
 */
export type TProgramQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
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

/**
 * @description Pain level of client
 * @param painIndex 0-9
 */
export type TPainLevel = {
  painIndex: number;
  date: Date;
};

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
  type: "Stretch" | "Strength" | "Release" | "Other";
};

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

/**
 * @description Client data from client collection
 * @param platform ios or android
 * @param currentProgramId Id of the program the client is currently doing
 * @param programs Array of programs progress data from programs subcollection to client
 */
export type TClientProfile = {
  name: string;
  birthDate: Date;
  gender: "male" | "female" | "other";
  platform: "ios" | "android";
  currentProgramId?: string;
  programs?: { [key: string]: TClientProgram };
};
