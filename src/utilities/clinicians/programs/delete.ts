import { DocumentReference, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TProgramWrite } from "../../../types/programTypes";

export async function removeClinicianProgramPhase(
  clinicianId: string,
  clinicianProgramId: string,
  version: string,
  phaseId: `p${number}`
) {
  try {
    const programRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "versions",
      version
    ) as DocumentReference<TProgramWrite>;
    const phaseRef = doc(programRef, "phases", phaseId);

    await deleteDoc(phaseRef);

    return true;
  } catch (error) {
    console.error(
      "Error removing clinician program phase",
      error,
      clinicianId,
      clinicianProgramId,
      version,
      phaseId
    );

    return false;
  }
}

export async function removeClinicianProgramDay(
  clinicianId: string,
  clinicianProgramId: string,
  version: string,
  dayId: `d${number}`
) {
  try {
    const programRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "versions",
      version
    ) as DocumentReference<TProgramWrite>;
    const daysRef = doc(programRef, "days", dayId);

    await deleteDoc(daysRef);

    return true;
  } catch (error) {
    console.error(
      "Error removing clinician program phase",
      error,
      clinicianId,
      clinicianProgramId,
      version,
      dayId
    );

    return false;
  }
}
