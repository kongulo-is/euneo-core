import {
  collection,
  CollectionReference,
  getDocs,
  doc,
  DocumentReference,
  getDoc,
  setDoc,
  query,
  where,
  endAt,
  startAt,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TExercise, TExerciseWrite } from "../../types/baseTypes";
import { exerciseConverter } from "../converters";
import { updateDoc } from "../updateDoc";

export async function getAllExercises(): Promise<Record<string, TExercise>> {
  try {
    const exercisesRef = collection(
      db,
      "exercises"
    ) as CollectionReference<TExerciseWrite>;
    const exercisesSnap = await getDocs(
      exercisesRef.withConverter(exerciseConverter)
    );
    const exercisesList = exercisesSnap.docs.map((doc) => doc.data());

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

// export async function getAllEuneoAndClinicianExercises(
//   clinicianId: string
// ): Promise<Record<string, TExercise>> {
//   try {
//     const exercisesRef = collection(
//       db,
//       "exercises"
//     ) as CollectionReference<TExerciseWrite>;

//     // Create the query to filter by clinicianId
//     const queryRef = query(
//       exercisesRef.withConverter(exerciseConverter),
//       where("clinicianId", "in", [null, clinicianId])
//     );

//     const exercisesSnap = await getDocs(queryRef);
//     const exercisesList = exercisesSnap.docs.map((doc) => doc.data());

//     // create a map of exercises
//     const exercises = Object.fromEntries(
//       exercisesList.map((exercise) => [exercise.id, exercise])
//     );

//     return exercises;
//   } catch (error) {
//     console.error("Error fetching exercises:", error);
//     throw error;
//   }
// }

export async function getAllEuneoAndClinicianExercises(
  clinicianId: string
): Promise<Record<string, TExercise>> {
  try {
    const exercisesRef = collection(
      db,
      "exercises"
    ) as CollectionReference<TExerciseWrite>;

    // Query for exercises with the specific clinicianId and ID starting with "EHE"
    const clinicianQueryRef = query(
      exercisesRef.withConverter(exerciseConverter),
      where("clinicianId", "==", clinicianId)
    );

    // Query for exercises without a clinicianId and ID starting with "EHE"
    const noClinicianQueryRef = query(
      exercisesRef.withConverter(exerciseConverter),
      orderBy("__name__"),
      startAt("EHE"),
      endAt("EHE\uf8ff")
    );

    const developmentQueryRef = query(
      exercisesRef.withConverter(exerciseConverter),
      orderBy("__name__"),
      startAt("AA"),
      endAt("AA\uf8ff")
    );

    // Fetch both sets of exercises
    const [
      clinicianExercisesSnap,
      noClinicianExercisesSnap,
      developmentExercisesSnap,
    ] = await Promise.all([
      getDocs(clinicianQueryRef),
      getDocs(noClinicianQueryRef),
      getDocs(developmentQueryRef),
    ]);

    const clinicianExercisesList = clinicianExercisesSnap.docs.map((doc) =>
      doc.data()
    );
    const noClinicianExercisesList = noClinicianExercisesSnap.docs.map((doc) =>
      doc.data()
    );

    const developmentExercisesList = developmentExercisesSnap.docs.map((doc) =>
      doc.data()
    );

    // Combine both lists
    const combinedExercisesList = [
      ...clinicianExercisesList,
      ...noClinicianExercisesList,
      ...developmentExercisesList,
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
    const exerciseRef = doc(
      db,
      "exercises",
      id
    ) as DocumentReference<TExerciseWrite>;
    const exerciseSnap = await getDoc(
      exerciseRef.withConverter(exerciseConverter)
    );
    const exercise = exerciseSnap.data();
    if (!exercise) throw new Error(`Exercise with id ${id} not found`);
    return exercise;
  } catch (error) {
    console.error("Error fetching exercise:", error);
    throw error;
  }
}

export async function uploadExercise(
  exercise: TExerciseWrite,
  clinicianId: string
): Promise<string> {
  try {
    const randomId = Math.random().toString(36).substring(7);
    const exerciseRef = doc(db, "exercises", "AAAAA-" + randomId);
    await setDoc(exerciseRef, { ...exercise, clinicianId });
    return exerciseRef.id;
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
    const exerciseRef = doc(
      db,
      "exercises",
      exerciseId
    ) as DocumentReference<TExerciseWrite>;
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
