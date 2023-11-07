import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";

export async function updateProgramDay(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  //TODO: fix type..
  exercises: any,
  adherence: number
) {
  try {
    const day = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId,
      "days",
      dayId.toString()
    );

    updateDoc(day, {
      adherence: adherence,
      // TODO: create a converter
      exercises: exercises.map((e: any) => e.iteration),
    });
  } catch (error) {
    console.error("Error updating program day: ", error, {
      clientId,
      clientProgramId,
      dayId,
      exercises,
      adherence,
    });
    throw error;
  }
}

export async function updateProgramDayDate(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  //TODO: fix type..
  newDate: Date
) {
  try {
    const day = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId,
      "days",
      dayId
    );

    updateDoc(day, {
      date: newDate,
    });
  } catch (error) {
    console.error("Error updating program day: ", error, {
      clientId,
      clientProgramId,
      dayId,
      newDate,
    });
    throw error;
  }
}
