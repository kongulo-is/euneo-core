import {
  DocumentReference,
  collection,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  TEuneoProgram,
  TProgram,
  TProgramVersionWrite,
} from "../../types/programTypes";
import { db } from "../../firebase/db";

export async function removeOldPhasesAndDays(
  program: TProgram
): Promise<boolean> {
  try {
    let programRef: DocumentReference<TProgramVersionWrite>;
    if ("clinicianProgramId" in program) {
      programRef = doc(
        db,
        "clinicians",
        program.clinicianId,
        "programs",
        program.clinicianProgramId
      ) as DocumentReference<TProgramVersionWrite>;
    } else {
      const euneoProgram = program as TEuneoProgram;
      programRef = doc(
        db,
        "testPrograms",
        euneoProgram.euneoProgramId
      ) as DocumentReference<TProgramVersionWrite>;
    }
    const daysRef = collection(programRef, "days");
    const days = program.days;

    await Promise.all(
      Object.keys(days).map((id) => {
        return deleteDoc(doc(daysRef, id));
      })
    );

    const phasesRef = collection(programRef, "phases");
    const phases = program.phases;

    await Promise.all(
      Object.keys(phases).map((id) => {
        return deleteDoc(doc(phasesRef, id));
      })
    );
    return true;
  } catch (error) {
    console.error("Error removing old phases and days: ", error, program);
  }
  throw new Error("Error removing old phases and days");
}
