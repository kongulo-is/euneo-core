import { doc, DocumentReference, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TClinicianProgram,
  TProgramWrite,
  TProgramDayWrite,
  TProgramPhaseRead,
  TProgramPhaseWrite,
} from "../../../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "../../converters";

export async function updateClinicianProgram(
  clinicianProgram: TProgramRead,
  phases: Record<`p${number}`, TProgramPhaseRead>,
  days: Record<`d${number}`, TProgramDayRead>,
  clinicianProgramId: string,
  clinicianId: string
): Promise<TClinicianProgram> {
  try {
    const programRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId
    ) as DocumentReference<TProgramWrite>;

    // convert and update program.
    const programConverted = programConverter.toFirestore(clinicianProgram);
    await updateDoc(programRef, programConverted);

    // convert and update program days and phases.
    const day = programDayConverter.toFirestore(days["d1"]);
    const dayRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "days",
      "d1"
    ) as DocumentReference<TProgramDayWrite>;
    await updateDoc(dayRef, day);

    const phase = programPhaseConverter.toFirestore(phases["p1"]);
    const phaseRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "phases",
      "p1"
    ) as DocumentReference<TProgramPhaseWrite>;
    await updateDoc(phaseRef, phase);

    return {
      ...clinicianProgram,
      phases,
      days,
      clinicianProgramId,
      clinicianId,
    };
  } catch (error) {
    console.error(
      "Error updating clinician program: ",
      error,
      clinicianProgram,
      days,
      clinicianProgramId,
      clinicianId
    );
  }
  throw new Error("Error updating clinician program");
}
