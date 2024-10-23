import { DocumentReference, deleteDoc, doc } from "firebase/firestore";
import {
  TProgramVersionRead,
  TProgramVersionWrite,
} from "../../../entities/program/version";
import { Collection } from "../../../entities/global";
import { TProgramPhaseKey } from "../../../entities/program/programPhase";

export async function removeClinicianProgramPhase(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  phaseId: TProgramPhaseKey
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
      phaseId
    );

    return false;
  }
}

// TODO: fix this function
export async function removeClinicianProgramDay(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  dayId: `d${number}`
) {
  try {
    const daysRef = doc(programVersionRef, Collection.Days, dayId);

    await deleteDoc(daysRef);

    return true;
  } catch (error) {
    console.error(
      "Error removing clinician program phase",
      error,
      programVersionRef.path,
      dayId
    );

    return false;
  }
}
