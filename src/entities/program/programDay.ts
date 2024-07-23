import {
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/db";

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

export type TProgramDayWrite = {
  exercises: TProgramDayExerciseWrite[];
};

export type TProgramDayRead = { exercises: TProgramDayExercise[] };

export type TProgramDay = TProgramDayRead;

// Common Types
export type TProgramDayKey = `d${number}` | `${string}_d${number}`;

export const programDayConverter = {
  toFirestore(day: TProgramDay): TProgramDayWrite {
    return {
      exercises: day.exercises.map((e) => {
        return {
          reference: doc(db, "exercises", e.exerciseId),
          time: e.time,
          reps: e.reps,
          sets: e.sets,
        };
      }),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramDayWrite>,
    options: SnapshotOptions,
  ): TProgramDay {
    const data = snapshot.data(options);
    let { exercises } = data;

    const convertedExercises =
      exercises?.map((exercise) => {
        const { reference, ...rest } = exercise;

        return {
          ...rest,
          exerciseId: reference.id,
        };
      }) || [];

    return {
      exercises: convertedExercises,
    };
  },
};
