import { doc, DocumentReference, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TClinicianProgram,
  TProgramWrite,
  TProgramDayWrite,
} from "../../../types/programTypes";
import { programConverter, programDayConverter } from "../../converters";

export async function updateClinicianProgram(
  clinicianProgram: TProgramRead,
  days: Record<`d${number}`, TProgramDayRead>,
  clinicianProgramId: string,
  cliniciansId: string
): Promise<TClinicianProgram> {
  try {
    const programRef = doc(
      db,
      "clinicians",
      cliniciansId,
      "programs",
      clinicianProgramId
    ) as DocumentReference<TProgramWrite>;

    // convert and update program.
    const programConverted = programConverter.toFirestore(clinicianProgram);
    await updateDoc(programRef, programConverted);

    // convert and update program days.
    const day = programDayConverter.toFirestore(days["d1"]);
    const dayRef = doc(
      db,
      "clinicians",
      cliniciansId,
      "programs",
      clinicianProgramId,
      "days",
      "d1"
    ) as DocumentReference<TProgramDayWrite>;
    await updateDoc(dayRef, day);

    return {
      ...clinicianProgram,
      mode: "continuous",
      days,
      clinicianProgramId,
      cliniciansId,
    };
  } catch (error) {
    console.error(
      "Error updating clinician program: ",
      error,
      clinicianProgram,
      days,
      clinicianProgramId,
      cliniciansId
    );
  }
  throw new Error("Error updating clinician program");
}
