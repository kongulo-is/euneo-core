import { DocumentReference, doc, updateDoc } from "firebase/firestore";
import { TClinicianProgram, TProgramWrite } from "../../types/programTypes";
import { db } from "../../firebase/db";
import { _getDeprecatedProgramFromRef } from "../programHelpers";
import { programConverter, programPhaseConverter } from "../converters";
import { createVersionForDeprecatedProgram } from "./add";

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
  await createVersionForDeprecatedProgram(
    program,
    program.phases,
    program.days
  );
  return program;
};
