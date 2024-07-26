// import { DocumentReference, Timestamp } from "firebase/firestore";
// import {
//   TConditionId,
//   TEuneoProgramId,
//   TOutcomeMeasureWrite,
// } from "./baseTypes";
// import { TOutcomeMeasureId } from "./clinicianTypes";

// /**
//  * @memberof TProgramDay
//  * @description Exercise in a day in program collection. Either Euneo or custom program.
//  * @param id Id of the exercise - ref in firebase
//  */
// export type TProgramDayExercise = {
//   exerciseId: string;
//   time: number;
//   sets: number;
//   reps: number;
// };

// export type TNextPhase = {
//   phaseId: TProgramPhaseKey;
//   length?: number;
//   maxPainLevel: number;
//   minPainLevel: number;
// };

// export type TProgramDay = { exercises: TProgramDayExercise[] };

// export type TProgramDayRead = TProgramDay;

// // Common Types
// export type TProgramDayKey = `d${number}` | `${string}_d${number}`;

// export type TProgramPhaseBase = {
//   days: TProgramDayKey[];
//   name?: string;
//   length?: number;
//   nextPhase?: TNextPhase[];
//   finalPhase: boolean;
//   description?: string;
//   mode: "finite" | "continuous" | "maintenance";
//   hidden?: boolean; // For compatibility (old modified programs that have more than one continuous phase after upgrade)
// };
// export type TProgramFinitePhase = TProgramPhaseBase & {
//   length: number;
//   mode: "finite";
// };

// export type TProgramContinuousPhase = TProgramPhaseBase & {
//   mode: "continuous" | "maintenance";
// };

// export type TProgramPhaseRead = (
//   | TProgramFinitePhase
//   | TProgramContinuousPhase
// ) & {
//   programId: string;
//   clinicianId?: string;
//   version: string;
// };
// export type TProgramPhaseKey = `p${number}` | `${string}_p${number}`;

// export type TProgramPhase = TProgramPhaseRead;

// export type TConditionAssessmentQuestion = {
//   question: string;
//   title: string;
//   type: "boolean" | "option";
//   options: string[];
//   initialPhases?: { phaseId: TProgramPhaseKey; length?: number }[];
// };

// // Exported Types

// export type TProgramBase = {
//   name?: string;
//   outcomeMeasureIds?: TOutcomeMeasureId[];
//   conditionAssessment?: TConditionAssessmentQuestion[];
//   conditionId: TConditionId | null;
//   isLive?: boolean;
//   isConsoleLive?: boolean;
//   variation?: string;
//   version: string;
// };

// export type TProgramRead = TProgramBase;

// export type TProgramWithSubCollections = TProgramRead & {
//   days: Record<TProgramDayKey, TProgramDay>;
//   phases: Record<TProgramPhaseKey, TProgramPhase>;
//   // TODO: Make this mandatory?
//   createdAt?: Date;
//   lastUpdatedAt?: Date;
// };

// export type TEuneoProgram = TProgramWithSubCollections & {
//   euneoProgramId: TEuneoProgramId;
// };

// export type TClinicianProgram = TProgramWithSubCollections & {
//   clinicianProgramId: string;
//   clinicianId: string;
//   isArchived?: boolean;
//   isSaved?: boolean;
// };

// // Program version types
// export type TProgramVersionBase = {
//   programId: string;
//   currentVersion: string; // version id
//   isConsoleLive?: boolean;
//   isLive?: boolean;
//   isSaved?: boolean;
//   // TODO: Make this mandatory?
//   createdAt?: Date;
//   lastUpdatedAt?: Date;
// };

// export type TProgramVersionRead = TProgramVersionBase;

// export type TClinicianProgramVersion = TProgramVersionRead & {
//   clinicianId: string;
//   isArchived?: boolean;
// };

// export type TEuneoProgramVersion = TProgramVersionRead;

// export type TProgramVersion = TClinicianProgramVersion | TEuneoProgramVersion;

// export type TProgramVersionBaseWrite = {
//   currentVersion: DocumentReference<TProgramWrite>;
//   isConsoleLive?: boolean;
//   isLive?: boolean;
//   isSaved?: boolean;
//   // TODO: Make this mandatory?
//   createdAt?: Timestamp;
//   lastUpdatedAt?: Timestamp;
// };

// export type TClinicianProgramVersionWrite = TProgramVersionBaseWrite & {
//   isArchived?: boolean;
// };

// export type TEuneoProgramVersionWrite = TProgramVersionBaseWrite;

// export type TProgramVersionWrite =
//   | TClinicianProgramVersionWrite
//   | TEuneoProgramVersionWrite;

// export type TProgram = TEuneoProgram | TClinicianProgram;

// //  ! Write types

// /**
//  * @description custom program data as it is stored in the database in program subcollection in clinician collection
//  * @path /clinicians/{clinicianId}/programs/{programId}
//  */
// export type TProgramWrite = {
//   name?: string;
//   conditionId: TConditionId | null;
//   outcomeMeasureRefs: DocumentReference<TOutcomeMeasureWrite>[]; // Always exists but might be empty
//   conditionAssessment: TConditionAssessmentQuestion[]; // Always exists but might be empty
//   variation?: string;
// };

// /**
//  * @description custom day in subcollection days in program subcollection in clinician or programs collection
//  * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}
//  * @path /programs/{programId}/days/{dayId}
//  */
// export type TProgramDayWrite = {
//   exercises: TExerciseDayWrite[];
// };

// /**
//  * @description custom day in subcollection days in program subcollection in clinician or programs collection
//  * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}
//  * @path /programs/{programId}/days/{dayId}
//  */
// export type TProgramPhaseWrite = {
//   days: DocumentReference[];
//   name?: string;
//   length?: number;
//   nextPhase?: TNextPhase[];
//   finalPhase: boolean;
//   description?: string;
//   mode: "finite" | "continuous" | "maintenance";
// };

// /**
//  * @description exercise in custom day in subcollection days in program subcollection in clinician collection
//  * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}/exercises/{exerciseId}
//  * @path /programs/{programId}/days/{dayId}/exercises/{exerciseId}
//  */
// export type TExerciseDayWrite = {
//   reference: DocumentReference;
//   time: number;
//   sets: number;
//   reps: number;
// };
