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
import {
  deserializeClinicPath,
  TClinicIdentifiers,
  TClinicRef,
} from "../clinic/clinic";

export type TExerciseIdentifiers = {
  [Collection.Exercises]: string;
};

export type TExerciseRef = DocumentReference<TExerciseRead, TExerciseWrite>;
export type TExerciseCollectionRef = CollectionReference<
  TExerciseRead,
  TExerciseWrite
>;

export type TArea =
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

export type TExerciseArea = TArea;

export type TProgramArea = TArea;

export type TOutcomeMeasureArea = TArea;

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
  | "Weight/s"
  | "Foam roller"
  | "Bench"
  | "Kettlebell"
  | "Balance pad"
  | "Sandbag"
  | "Skipping rope"
  | "Dowel"
  | "Box"
  | "Tape"
  | "None";

export type TExerciseField = "Sets" | "Reps" | "Time";

// Base type with common fields
export type TExerciseWrite = {
  name: string;
  variation: string;
  primaryArea?: TExerciseArea[] | null;
  primaryType?: TExerciseType | null;
  primarySubtype?: TExerciseSubtype | null;
  startPreview: number;
  thumbnailTimestamp: number;
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
  /**
   * @deprecated
   */
  description: string;
  creator: "Euneo Health" | "Clinician" | "Clinic";
  steps?: string[];
  instructions?: string;
  tips?: string[];
  secondaryArea?: TExerciseArea[] | null;
  secondaryType?: TExerciseType | null;
  secondarySubtype?: TExerciseSubtype | null;
  equipmentNeeded?: TEquipment[] | null;
  equipmentShown?: TEquipment[] | null;
  targetedMuscles?: string[] | null;
  primaryInvolvedMuscleGroups?: string[] | null;
  primaryInvolvedMuscles?: string[] | null;
  creatorRef?: TClinicianRef | TClinicRef;
  createdAt?: Timestamp;
  /**
   * @deprecated use creatorRef instead
   */
  clinicianRef?: TClinicianRef;
};

// Unified read type
export type TExerciseRead = {
  id: string;
  variation: string;
  name: string;
  primaryArea?: TExerciseArea[] | null;
  primaryType?: TExerciseType | null;
  primarySubtype?: TExerciseSubtype | null;
  startPreview: number;
  thumbnailTimestamp: number;
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
  /**
   * @deprecated
   */
  description: string;
  createdAt?: Date;
  creator: "Euneo Health" | "Clinician" | "Clinic";
  steps?: string[];
  instructions?: string;
  tips?: string[];
  secondaryArea?: TExerciseArea[] | null;
  secondaryType?: TExerciseType | null;
  secondarySubtype?: TExerciseSubtype | null;
  equipmentNeeded?: TEquipment[] | null;
  equipmentShown?: TEquipment[] | null;
  targetedMuscles?: string[] | null;
  primaryInvolvedMuscleGroups?: string[] | null;
  primaryInvolvedMuscles?: string[] | null;
  creatorRef?: TClinicianRef | TClinicRef;
  /**
   * @deprecated use creatorRef instead
   */
  clinicianRef?: TClinicianRef;
  creatorIdentifiers?: TClinicIdentifiers;
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
    return `${Collection.Exercises}/${obj[Collection.Exercises]}`;
  } catch (error) {
    console.error("Error serializing exercise identifiers: ", error);
    throw error;
  }
}

export const exerciseConverter = {
  toFirestore(exercise: TExercise): TExerciseWrite {
    const { id, createdAt, ...rest } = exercise;

    // Convert Date to Timestamp if it exists
    const date = createdAt ? { createdAt: Timestamp.fromDate(createdAt) } : {};

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

    // Convert Timestamp to Date if createdAt is present
    const date = data.createdAt ? data.createdAt.toDate() : undefined;

    const equipmentNeeded = data.equipmentNeeded
      ? data.equipmentNeeded.length > 0
        ? data.equipmentNeeded
        : (["None"] as TEquipment[])
      : [];

    return {
      ...data,
      id: snapshot.id,
      createdAt: date,
      primaryArea: data.primaryArea ? data.primaryArea : [],
      creatorIdentifiers: data.creatorRef
        ? deserializeClinicPath(data.creatorRef.path)
        : undefined,
      equipmentNeeded,
    };
  },
};
