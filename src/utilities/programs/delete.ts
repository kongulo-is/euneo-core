import {
  DocumentReference,
  collection,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { TProgram } from "../../entities/program/program";

export async function removeOldPhasesAndDays(
  program: TProgram,
): Promise<boolean> {
  try {
    const { programRef } = program.programInfo;

    const daysRef = collection(programRef, "days");
    const days = program.days;

    await Promise.all(
      Object.keys(days).map((id) => {
        return deleteDoc(doc(daysRef, id));
      }),
    );

    const phasesRef = collection(programRef, "phases");
    const phases = program.phases;

    await Promise.all(
      Object.keys(phases).map((id) => {
        return deleteDoc(doc(phasesRef, id));
      }),
    );
    return true;
  } catch (error) {
    console.error("Error removing old phases and days: ", error, program);
  }
  throw new Error("Error removing old phases and days");
}
