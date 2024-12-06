import {
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  endAt,
  startAt,
  orderBy,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { updateDoc } from "../updateDoc";
import {
  createExerciseCollectionRef,
  createExerciseRef,
  deserializeExercisePath,
  exerciseConverter,
  TExercise,
  TExerciseWrite,
} from "../../entities/exercises/exercises";
import { createClinicianRef } from "../../entities/clinician/clinician";
import { Collection } from "../../entities/global";

export async function getAllExercises(): Promise<Record<string, TExercise>> {
  try {
    const exerciseCollectionRef = createExerciseCollectionRef();
    const exercisesSnap = await getDocs(exerciseCollectionRef);

    const exercisesList: TExercise[] = exercisesSnap.docs.map((doc) => ({
      ...doc.data(),
      exerciseRef: doc.ref,
      exerciseIdentifiers: deserializeExercisePath(doc.ref.path),
    }));

    // create a map of exercises
    const exercises = Object.fromEntries(
      exercisesList.map((exercise) => [exercise.id, exercise])
    );

    return exercises;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw error;
  }
}

export async function getAllEuneoAndClinicianExercises(
  clinicianId: string
): Promise<Record<string, TExercise>> {
  try {
    const exerciseCollectionRef = createExerciseCollectionRef();

    const clinicianRef = createClinicianRef(clinicianId);

    // Query for exercises with the specific clinicianId and ID starting with "EHE"
    const clinicianQueryRef = query(
      exerciseCollectionRef,
      where("clinicianRef", "==", clinicianRef)
    );

    // Query for exercises without a clinicianId and ID starting with "EHE"
    const noClinicianQueryRef = query(
      exerciseCollectionRef,
      where("isConsoleLive", "==", true),
      orderBy("__name__"),
      startAt("EHE"),
      endAt("EHE\uf8ff")
    );

    // Fetch both sets of exercises
    const [clinicianExercisesSnap, noClinicianExercisesSnap] =
      await Promise.all([
        getDocs(clinicianQueryRef),
        getDocs(noClinicianQueryRef),
      ]);

    const clinicianExercisesList = clinicianExercisesSnap.docs.map((doc) => ({
      ...doc.data(),
      exerciseRef: doc.ref,
      exerciseIdentifiers: deserializeExercisePath(doc.ref.path),
    }));

    const noClinicianExercisesList = noClinicianExercisesSnap.docs.map(
      (doc) => ({
        ...doc.data(),
        exerciseRef: doc.ref,
        exerciseIdentifiers: deserializeExercisePath(doc.ref.path),
      })
    );

    // Combine both lists
    const combinedExercisesList = [
      ...clinicianExercisesList,
      ...noClinicianExercisesList,
    ];

    // Create a map of exercises
    const exercises = Object.fromEntries(
      combinedExercisesList.map((exercise) => [exercise.id, exercise])
    );

    return exercises;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw error;
  }
}

export async function getExerciseById(id: string): Promise<TExercise> {
  try {
    const exerciseRef = createExerciseRef({ exercises: id });
    const exerciseSnap = await getDoc(exerciseRef);
    const exercise = exerciseSnap.data();
    if (!exercise) throw new Error(`Exercise with id ${id} not found`);

    return {
      ...exercise,
      exerciseRef,
      exerciseIdentifiers: deserializeExercisePath(exerciseRef.path),
    };
  } catch (error) {
    console.error("Error fetching exercise:", error);
    throw error;
  }
}

export async function uploadExercise(
  exercise: TExerciseWrite,
  clinicianId: string
): Promise<TExercise> {
  try {
    const exerciseRef = createExerciseCollectionRef();
    const clinicianRef = createClinicianRef(clinicianId);
    const docRef = await addDoc(exerciseRef, {
      ...exercise,
      creatorRef: clinicianRef,
      createdAt: new Date(),
      id: exerciseRef.id,
    });

    const newExercise = await getExerciseById(docRef.id);
    return newExercise;
  } catch (error) {
    console.error("Error uploading exercise:", error);
    throw error;
  }
}

export async function updateExerciseTimestampAndPreview(
  exerciseId: string,
  time: number
): Promise<string> {
  try {
    const exerciseRef = createExerciseRef({ exercises: exerciseId });
    await updateDoc(exerciseRef, {
      thumbnailTimestamp: time,
      startPreview: time,
    });
    return exerciseRef.id;
  } catch (error) {
    console.error("Error uploading exercise:", error);
    throw error;
  }
}
