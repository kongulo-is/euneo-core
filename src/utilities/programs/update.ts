import { updateDoc } from "firebase/firestore";
import { TClinicianProgram } from "../../entities/program/program";

export const archiveClinicianProgram = async (program: TClinicianProgram) => {
  try {
    await updateDoc(program.programInfo.programRef, {
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
