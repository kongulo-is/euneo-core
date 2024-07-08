import { doc, updateDoc } from "firebase/firestore";
import { TExercise } from "../../types/baseTypes";
import { db } from "../../firebase/db";

export async function makeExercisesConsoleLive(
  exercises: Record<string, TExercise>
): Promise<boolean> {
  try {
    Object.keys(exercises).forEach(async (id) => {
      const exerciseRef = doc(db, "exercises", id);
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
