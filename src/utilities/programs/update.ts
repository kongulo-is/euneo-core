import { DocumentReference, doc, updateDoc } from "firebase/firestore";
import { TClinicianProgram, TProgramWrite } from "../../types/programTypes";
import { db } from "../../firebase/db";
import { _getDeprecatedProgramFromRef } from "../programHelpers";
import { createVersionForDeprecatedProgram } from "./add";
import { removeOldPhasesAndDays } from "./delete";

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

export const upgradeDeprecatedProgram = async (
  programRef: DocumentReference<TProgramWrite>
) => {
  const program = await _getDeprecatedProgramFromRef(programRef);
  if ("clinicianProgramId" in program) {
    // Only delete old phases and days from clinician programs
    removeOldPhasesAndDays(program);
  }
  await Promise.all([
    createVersionForDeprecatedProgram(
      program,
      program.phases,
      program.days,
      "clinicianId" in program ? program.clinicianId : undefined,
      "clinicianProgramId" in program ? program.clinicianProgramId : undefined
    ),
  ]);
  return program;
};
