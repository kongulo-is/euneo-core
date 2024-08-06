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
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { updateDoc } from "../updateDoc";
import {
  createExerciseCollectionRef,
  createExerciseRef,
  deserializeExercisePath,
  TExercise,
  TExerciseWrite,
} from "../../entities/exercises/exercises";
import { createClinicianRef } from "../../entities/clinician/clinician";

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
      exercisesList.map((exercise) => [exercise.id, exercise]),
    );

    return exercises;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw error;
  }
}

export async function getAllEuneoAndClinicianExercises(
  clinicianId: string,
): Promise<Record<string, TExercise>> {
  try {
    const exerciseCollectionRef = createExerciseCollectionRef();

    const clinicianRef = createClinicianRef(clinicianId);

    // Query for exercises with the specific clinicianId and ID starting with "EHE"
    const clinicianQueryRef = query(
      exerciseCollectionRef,
      where("clinicianRef", "==", clinicianRef),
    );

    // Query for exercises without a clinicianId and ID starting with "EHE"
    const noClinicianQueryRef = query(
      exerciseCollectionRef,
      where("isConsoleLive", "==", true),
      orderBy("__name__"),
      startAt("EHE"),
      endAt("EHE\uf8ff"),
    );

    // const developmentQueryRef = query(
    //   exercisesRef.withConverter(exerciseConverter),
    //   orderBy("__name__"),
    //   startAt("AA"),
    //   endAt("AA\uf8ff")
    // );

    // Fetch both sets of exercises
    const [
      clinicianExercisesSnap,
      noClinicianExercisesSnap,
      // developmentExercisesSnap,
    ] = await Promise.all([
      getDocs(clinicianQueryRef),
      getDocs(noClinicianQueryRef),
      // getDocs(developmentQueryRef),
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
      }),
    );

    // const developmentExercisesList = developmentExercisesSnap.docs.map((doc) =>
    //   doc.data()
    // );

    // Combine both lists
    const combinedExercisesList = [
      ...clinicianExercisesList,
      ...noClinicianExercisesList,
      // ...developmentExercisesList,
    ];

    // Create a map of exercises
    const exercises = Object.fromEntries(
      combinedExercisesList.map((exercise) => [exercise.id, exercise]),
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
  clinicianId: string,
): Promise<string> {
  try {
    const randomId = Math.random().toString(36).substring(7);

    const exerciseRef = createExerciseRef({ exercises: "AAAAA-" + randomId });
    const clinicianRef = createClinicianRef(clinicianId);
    await setDoc(exerciseRef, {
      ...exercise,
      clinicianRef,
      id: "AAAAA-" + randomId,
      createdAt: new Date(),
    });
    return exerciseRef.id;
  } catch (error) {
    console.error("Error uploading exercise:", error);
    throw error;
  }
}

export async function updateExerciseTimestampAndPreview(
  exerciseId: string,
  time: number,
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
