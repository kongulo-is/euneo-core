import { collection, CollectionReference, getDocs } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TExercise, TExerciseWrite } from "../../types/baseTypes";
import { exerciseConverter } from "../converters";

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
