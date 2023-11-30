import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TClientProgramWrite } from "../../../types/clientTypes";

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

    return await updateDoc(day, {
      date: newDate,
    })
      .then(() => true)
      .catch(() => false);
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

export async function updateProgramFields(
  clientId: string,
  clientProgramId: string,
  fields: Partial<TClientProgramWrite>
) {
  const clientProgramRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  );

  return await updateDoc(clientProgramRef, {
    ...fields,
  })
    .then(() => true)
    .catch(() => false);
}
