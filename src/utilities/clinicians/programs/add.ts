import { doc, collection, addDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TClinicianProgram,
  TProgramPhaseRead,
} from "../../../types/programTypes";
import { programConverter, programDayConverter } from "../../converters";

export async function createClinicianProgram(
  clinicianProgramRead: TProgramRead,
  phases: Record<`d${number}`, TProgramPhaseRead>,
  days: Record<`d${number}`, TProgramDayRead>,
  clinicianId: string
): Promise<TClinicianProgram> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const programsRef = collection(clinicianRef, "programs");
    const programRef = await addDoc(
      programsRef.withConverter(programConverter),
      clinicianProgramRead // * There is no error because
    );

    const daysRef = collection(programRef, "days");

    await setDoc(
      doc(daysRef.withConverter(programDayConverter), "d1"),
      days["d1"],
      { merge: true }
    );

    const clinicianProgram: TClinicianProgram = {
      ...clinicianProgramRead,
      phases,
      days,
      clinicianProgramId: programRef.id,
      clinicianId,
    };

    return clinicianProgram;
  } catch (error) {
    console.error("Error creating clinician program:", error, {
      clinicianProgramRead,
      days,
      clinicianId,
    });
  }
  throw new Error("Error creating clinician program");
}