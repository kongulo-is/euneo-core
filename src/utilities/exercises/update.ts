import { DocumentReference, doc } from "firebase/firestore";
import { TExercise, TExerciseWrite } from "../../types/baseTypes";
import { db } from "../../firebase/db";
import { updateDoc } from "../updateDoc";

export async function makeExercisesConsoleLive(
  exercises: Record<string, TExercise>,
): Promise<boolean> {
  try {
    Object.keys(exercises).forEach(async (id) => {
      const exerciseRef = doc(
        db,
        "exercises",
        id,
      ) as DocumentReference<TExerciseWrite>;
      await updateDoc(exerciseRef, {
        isConsoleLive: true,
      });
    });

    return true;
  } catch (error) {
    console.error("Error making exercises console live: ", error);
    return false;
  }
}

export async function archiveExercise(exercise: TExercise) {
  try {
    const exerciseRef = doc(
      db,
      "exercises",
      exercise.id,
    ) as DocumentReference<TExerciseWrite>;
    await updateDoc(exerciseRef, {
      isArchived: true,
    });
    return true;
  } catch (error) {
    console.error("Error archiving exercise: ", error);
    return false;
  }
}
