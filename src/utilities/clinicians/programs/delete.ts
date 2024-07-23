import { DocumentReference, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TProgramPhaseKey, TProgramWrite } from "../../../types/programTypes";
import {
  TProgramVersionRead,
  TProgramVersionWrite,
} from "../../../entities/program/version";
import { Collection } from "../../../entities/global";

export async function removeClinicianProgramPhase(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  phaseId: TProgramPhaseKey,
) {
  try {
    const phaseRef = doc(programVersionRef, Collection.Phases, phaseId);
    await deleteDoc(phaseRef);
    return true;
  } catch (error) {
    console.error(
      "Error removing clinician program phase",
      error,
      programVersionRef.path,
      phaseId,
    );

    return false;
  }
}

export async function removeClinicianProgramDay(
  clinicianId: string,
  clinicianProgramId: string,
  version: string,
  dayId: `d${number}`,
) {
  try {
    const programRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "versions",
      version,
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
      dayId,
    );

    return false;
  }
}
