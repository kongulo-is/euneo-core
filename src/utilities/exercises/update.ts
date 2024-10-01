import { updateDoc } from "../updateDoc";
import {
  createExerciseRef,
  TExercise,
  TExerciseRead,
  TExerciseRef,
} from "../../entities/exercises/exercises";

export async function makeExercisesConsoleLive(
  exercises: Record<string, TExercise>
): Promise<boolean> {
  try {
    Object.keys(exercises).forEach(async (id) => {
      const exerciseRef = createExerciseRef({ exercises: id });

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

export async function archiveExercise(exerciseRef: TExerciseRef) {
  try {
    await updateDoc(exerciseRef, {
      isArchived: true,
    });
    return true;
  } catch (error) {
    console.error("Error archiving exercise: ", error);
    return false;
  }
}

export const updateExerciseDetails = async (
  exerciseRef: TExerciseRef,
  exerciseDetails: Partial<TExerciseRead>
) => {
  await updateDoc(exerciseRef, exerciseDetails);
};
