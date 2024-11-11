import { updateDoc } from "firebase/firestore";
import {
  TClinicianProgram,
  TClinicianProgramWithoutSubCollections,
} from "../../entities/program/program";

export const archiveClinicianProgram = async (
  program: TClinicianProgram | TClinicianProgramWithoutSubCollections
) => {
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
