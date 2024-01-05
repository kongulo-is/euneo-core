import { DocumentReference, doc, updateDoc } from "firebase/firestore";
import { TClinicianProgram } from "../../types/programTypes";
import { db } from "../../firebase/db";

export const archiveClinicianProgram = async (program: TClinicianProgram) => {
  try {
    // set isArchived to true
    const programRef = doc(
      db,
      "clinicians",
      program.clinicianId,
      "programs",
      program.clinicianProgramId
    ) as DocumentReference<TClinicianProgram>;

    await updateDoc(programRef, {
      isArchived: true,
    });

    return true;
  } catch (error) {
    console.error("Error archiving clinician program: ", error, {
      program,
    });
    return false;
  }
};
