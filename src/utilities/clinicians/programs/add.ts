import { doc, collection, addDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TClinicianProgram,
} from "../../../types/programTypes";
import { programConverter, programDayConverter } from "../../converters";

export async function createClinicianProgram(
  continuousProgram: TProgramRead,
  days: Record<`d${number}`, TProgramDayRead>,
  cliniciansId: string
): Promise<TClinicianProgram> {
  try {
    const clinicianRef = doc(db, "clinicians", cliniciansId);
    const programsRef = collection(clinicianRef, "programs");
    const programRef = await addDoc(
      programsRef.withConverter(programConverter),
      continuousProgram // * There is no error because
    );

    const daysRef = collection(programRef, "days");

    await setDoc(
      doc(daysRef.withConverter(programDayConverter), "d1"),
      days["d1"],
      { merge: true }
    );

    const clinicianProgram: TClinicianProgram = {
      ...continuousProgram,
      days,
      mode: "continuous",
      clinicianProgramId: programRef.id,
      cliniciansId,
    };

    return clinicianProgram;
  } catch (error) {
    console.error("Error creating clinician program:", error, {
      continuousProgram,
      days,
      cliniciansId,
    });
  }
  throw new Error("Error creating clinician program");
}
