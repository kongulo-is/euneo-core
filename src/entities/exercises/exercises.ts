import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { Collection } from "../global";
import { db } from "../../firebase/db";
import { TClinicianRef } from "../clinician/clinician";

export type TExerciseIdentifiers = {
  [Collection.Exercises]: string;
};

export type TExerciseRef = DocumentReference<TExerciseRead, TExerciseWrite>;
export type TExerciseCollectionRef = CollectionReference<
  TExerciseRead,
  TExerciseWrite
>;

export type TExerciseArea =
  | "Foot and ankle"
  | "Knee"
  | "Hip"
  | "Pelvic floor"
  | "Core"
  | "Lower back"
  | "Upper back"
  | "Neck"
  | "Shoulder"
  | "Elbow"
  | "Wrist and hand";

/**
 * @Stretch is deprecated
 * @Planks is deprecated
 */
export type TExerciseType =
  | "Strength"
  | "Mobility"
  | "Release"
  | "Balance"
  | "Aerobic" //new
  | "Jumps"
  | "Taping"
  | "Planks" //!deprecated
  | "Stretch"; //!deprecated

export type TExerciseSubtype =
  | "Eccentric"
  | "Isometric"
  | "Plyometrics"
  | "Static stretch"
  | "Dynamic stretch"
  | "AROM"
  | "PROM"
  | "Self massage"
  | "Foam rolling"
  | "Massage ball";

export type TEquipment =
  | "Resistance band"
  | "Massage ball"
  | "Exercise ball"
  | "Weights"
  | "Foam roller"
  | "Bench"
  | "Kettlebell"
  | "Balance pad"
  | "Sandbag"
  | "Skipping rope"
  | "Dowel"
  | "Box";

export type TExerciseField = "Sets" | "Reps" | "Time";

export type TExerciseWrite = {
  // TODO: þarf að vera á meðan gamla programmið er inni
  description: string;
  variation: string;
  startPreview: number;
  thumbnailTimestamp: number;
  name: string;
  steps: string[];
  instructions?: string;
  tips: string[];
  videoLink: {
    displayID: string;
    assetID: string;
  };
  defaultSets: number | null;
  defaultReps: number | null;
  defaultTime: number | null;
  type?: TExerciseType;
  editableFields: TExerciseField[];
  isConsoleLive: boolean;
  clinicianRef?: TClinicianRef;
  createdAt?: Timestamp;
  isArchived?: boolean;
  primaryArea?: TExerciseArea | null; // new field //TODO: this should be mandatory
  secondaryArea?: TExerciseArea | null; // new field
  primaryType?: TExerciseType | null; // new field (new "type" field) //TODO: this should be mandatory
  secondaryType?: TExerciseType | null; // new field
  primarySubtype?: TExerciseSubtype | null; // new field
  secondarySubtype?: TExerciseSubtype | null; // new field
  equipmentNeeded?: TEquipment[] | null; // new field
  equipmentShown?: TEquipment[] | null; // new field
  targetedMuscles?: string[] | null; // new field
  primaryInvolvedMuscleGroups?: string[] | null; // new field
  primaryInvolvedMuscles?: string[] | null; // new field
};

/**
 * @description Exercise in exercise collection
 * @param steps Instructions for the exercise
 * @param tips Tips for the exercise
 * @param displayID url video
 * @param assetID id of video in mux
 */
export type TExerciseRead = {
  id: string;
  variation: string;
  description: string;
  startPreview: number;
  thumbnailTimestamp: number;
  name: string;
  steps: string[];
  instructions?: string;
  tips: string[];
  videoLink: {
    displayID: string;
    assetID: string;
  };
  defaultSets: number | null;
  defaultReps: number | null;
  defaultTime: number | null;
  type?: TExerciseType;
  editableFields: TExerciseField[];
  isConsoleLive: boolean;
  clinicianRef?: TClinicianRef;
  createdAt?: Date;
  isArchived?: boolean;
  // New exercise fields
  primaryArea?: TExerciseArea | null; // new field //TODO: this should be mandatory
  secondaryArea?: TExerciseArea | null; // new field
  primaryType?: TExerciseType | null; // new field (new "type" field) //TODO: this should be mandatory
  secondaryType?: TExerciseType | null; // new field
  primarySubtype?: TExerciseSubtype | null; // new field
  secondarySubtype?: TExerciseSubtype | null; // new field
  equipmentNeeded?: TEquipment[] | null; // new field
  equipmentShown?: TEquipment[] | null; // new field
  targetedMuscles?: string[] | null; // new field
  primaryInvolvedMuscleGroups?: string[] | null; // new field
  primaryInvolvedMuscles?: string[] | null; // new field
};

export type TExercise = TExerciseRead & {
  exerciseRef: TExerciseRef;
  exerciseIdentifiers: TExerciseIdentifiers;
};

export function createExerciseRef({
  exercises,
}: {
  exercises?: string;
}): DocumentReference<TExerciseRead, TExerciseWrite> {
  const path = `${Collection.Exercises}/${exercises}`;
  return doc(db, path).withConverter(exerciseConverter);
}

export function createExerciseCollectionRef(): TExerciseCollectionRef {
  return collection(db, Collection.Exercises).withConverter(exerciseConverter);
}

export function deserializeExercisePath(path: string): TExerciseIdentifiers {
  try {
    const [_exercises, exerciseId] = path.split("/");
    return {
      [Collection.Exercises]: exerciseId,
    };
  } catch (error) {
    console.error("Error deserializing exercise path: ", error);
    throw error;
  }
}

export function serializeExerciseIdentifiers(
  obj: TExerciseIdentifiers
): string {
  try {
    return `${Collection.Exercises}/${obj.exercises}`;
  } catch (error) {
    console.error("Error serializing exercise identifiers: ", error);
    throw error;
  }
}

export const exerciseConverter = {
  toFirestore(exercise: TExercise): TExerciseWrite {
    const { id, createdAt, ...rest } = exercise;

    const date = createdAt && { createdAt: Timestamp.fromDate(createdAt) };

    const data: TExerciseWrite = {
      ...rest,
      ...date,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TExerciseWrite>,
    options: SnapshotOptions
  ): TExerciseRead {
    const data = snapshot.data(options);

    const date = data.createdAt && data.createdAt.toDate();

    const exercise: TExerciseRead = {
      ...data,
      id: snapshot.id,
      createdAt: date,
    };

    return exercise;
  },
};
