import { DocumentReference } from "firebase/firestore";

/**
 * @description exercise in custom day in subcollection days in program subcollection in clinician collection
 * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}/exercises/{exerciseId}
 * @path /programs/{programId}/days/{dayId}/exercises/{exerciseId}
 */
export type TProgramDayExerciseWrite = {
  reference: DocumentReference;
  time: number;
  sets: number;
  reps: number;
};
export type TProgramDayExercise = {
  exerciseId: string;
  time: number;
  sets: number;
  reps: number;
};

/**
 * @description custom day in subcollection days in program subcollection in clinician or programs collection
 * @path /clinicians/{clinicianId}/programs/{programId}/days/{dayId}
 * @path /programs/{programId}/days/{dayId}
 */
export type TProgramDayWrite = {
  exercises: TProgramDayExerciseWrite[];
};

export type TProgramDay = { exercises: TProgramDayExercise[] };

// Common Types
export type TProgramDayKey = `d${number}` | `${string}_d${number}`;
