/**
 * @description Physician data type
 */
export type Physio = {
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
export type PhysioClient = {
  docId: string;
  name: string;
  email: string;
  conditionId: ConditionId;
  status: Status;
  prescription?: Prescription;
  clientId?: string;
  program?: ClientProgram;
};

// TODO: það þarf að hugsa þetta með progamId. Það gengur ekki upp með custom programs ef á að sækja beint í gagnagrunn.
/**
 * @memberof PhysioClient
 * @description Prescription given to the client by physio
 * @param programId Id of the program (custom or euneo)
 * @param status Status of the invitation to client. (Invited, Accepted, Started)
 * @param programBy Euneo or Physio - is not in database
 */
export type Prescription = {
  programId: string;
  programBy: "Euneo" | "Physio"; //? bæta þessu við?
  prescriptionDate: Date;
  status: PrescriptionStatus;
};

/** @memberof Prescription */
export type PrescriptionStatus = "Invited" | "Accepted" | "Started";

/**
 * @memberof PhysioClient
 * @memberof ClientProfile
 * @description Clients program data/progress from clients collection.
 * @param pid Program Id
 * @param programBy Euneo or Physio Id - this is not stored in database
 * @param assessments assessment of clients progress, physical condition every 4 weeks.
 * @param days prescripted program mapped to training days.
 * @param painLevel pain level of the client mapped to dates.
 * @param conditionAssessment Answers to program questions regarding client condition at start of program. //?Þetta er gamla general.
 * @param phases how many days in each phase of the program. (p1: 2, etc.)
 * @param trainingDays which days are training days. (monday: true, etc.)
 * @param physical physical information about the client. (height, weight, etc.) //? Þetta er gamla userInfo.
 */
export type ClientProgram = {
  pid: string;
  programBy: "Euneo" | string; //? bæta þessu við? string: physioId
  conditionId: ConditionId;
  assessments: Assessment[];
  painLevel: PainLevel[];
  days: ClientProgramDay[];
  conditionAssessment?: Array<boolean | string>;
  phases?: Phase[];
  trainingDays?: boolean[];
  physical?: clientPhysical;
};

/**
 * @memberof ClientProgram
 * @description Physical information about the client
 * */
export type clientPhysical = {
  athlete: boolean;
  height: number;
  weight: number;
  unit: "metric" | "imperial";
  physicalActivity: "None" | "Low" | "Moderate" | "High";
};

/** @memberof ClientProgram */
export type Phase = { key: string; value: number };

/**
 * @memberof ClientProgram
 * @description Each day in clients program, progress. (date, adherence, restDay, etc.)
 * @param id (d1, d2, d3...)
 * @param phaseId (p1, p2, p3...)
 * @param adherence 0-100%
 * @param exercises array completed exercises in a day (0 = not completed, 1 = completed)
 */
export type ClientProgramDay = {
  id: string;
  phaseId: string;
  date: Date;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

/**
 * @memberof ClientProgram
 * @description Assessment of client during program.
 * @param name (FAAM, SF-36, VISA-A, PROMIS,...)
 */
export type Assessment = {
  date: Date;
  name: OutcomeMeasureId;
  type: string | "foot&ankle"; //TODO: what is dis?
  sections: AssessmentSection[];
};

/**
 * @memberof Assessment
 * @description Assessment result and answers.
 * @param score 0-100%
 * @param questions array of answeres to questions (0-4)
 */
export type AssessmentSection = {
  score: number;
  questions?: number[];
};

/** @memberof Assessment */
export type OutcomeMeasureId = "faam" | "sf-36" | "visa-a" | "promis";

/**
 * @description Euneo or custom program created by Physio
 * @param outcomeMeasureIds Ids of outcome measures used to track client progress every 4 weeks.
 * @param days exercises each day in program (d1, d2, etc.) with ref to exercise and sets, reps, seconds.
 */
type Program = {
  name: string;
  conditionId: ConditionId;
  outcomeMeasureIds: OutcomeMeasureId[];
  mode: ProgramMode;
  // TODO: ræða hvort days eigi að vera hér inni eða ekki.
  days?: ProgramDay[];
};

/**
 * @param conditionAssessment Only used in Euneo programs. Questions about the client condition to create phases and days in program.
 */
export type TEuneoProgram = Program & {
  pid: string;
  conditionAssessment: ProgramQuestion[]; //? Þetta er gamla general.
  createdBy: "Euneo";
};

export type TPhysioProgram = Program & {
  // TODO: docId verður að physioProgramId
  physioProgramId: string;
  // TODO: hér bætti ég við physioId
  physioId: string;
  createdBy: "Physio";
};

/** @memberof Program */
export type ProgramDay = { key: string; exercises: ExerciseDay[] };

/**
 * @memberof ProgramDay
 * @description Exercise in a day in program collection. Either Euneo or custom program.
 * @param id Id of the exercise - ref in firebase
 */
export type ExerciseDay = {
  id: string;
  quantity: number; //TODO: Er þetta bara notað fyrir seconds. Heita seconds?
  sets: number;
  reps: number;
};

export type ProgramMode = "continuous" | "phase";

/**
 * @memberof Program
 * @description Euneo program questions about the client condition
 */
export type ProgramQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
};

// Component types
export type Option = {
  value: string;
  label: string;
};

export type ChartPoint = {
  day: Date;
  value: number;
};

export type BarChartPoint = {
  day: Date;
  sections: {
    type: string;
    value: number;
  }[];
};

/**
 * @description Pain level of client
 * @param painIndex 0-9
 */
export type PainLevel = {
  painIndex: number;
  date: Date;
};

export type Status = "Active" | "Not Started" | "Inactive" | "No Prescription";

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

export type ConditionId =
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

export type EuneoProgramId = "plantar-heel-pain";

// !Client --------------------------------

/**
 * @description Client data from client collection
 * @param platform ios or android
 * @param currentProgramId Id of the program the client is currently doing
 * @param programs Array of programs progress data from programs subcollection to client
 */
export type ClientProfile = {
  name: string;
  birthDate: Date;
  gender: "male" | "female" | "other";
  platform: "ios" | "android";
  currentProgramId?: string;
  programs?: ClientProgram[];
};
