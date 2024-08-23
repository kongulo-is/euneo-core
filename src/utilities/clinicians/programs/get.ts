import {
  doc,
  DocumentReference,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/db";

import {
  _fetchDays,
  _fetchPhases,
  _getProgramFromRef,
} from "../../programHelpers";
import {
  TClinicianProgram,
  programConverter,
} from "../../../entities/program/program";
import {
  TProgramVersionRead,
  TProgramVersionWrite,
} from "../../../entities/program/version";

/**
 * @deprecated use getProgram instead // TODO: remove this?
 */
export async function getClinicianProgramWithDays(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,

  excludeMaintenance: boolean = false,
): Promise<TClinicianProgram> {
  const clinicianProgram = await _getProgramFromRef(
    programVersionRef,
    excludeMaintenance,
  );

  if (clinicianProgram.creator !== "clinician") {
    throw new Error("Program is not a clinician program");
  }

  // TODO: what was this doing?
  // if (clinicianClientId) {
  //   Object.keys(clinicianProgram.phases).forEach((key) => {
  //     if (key.includes("_") && !key.includes(clinicianClientId)) {
  //       delete clinicianProgram.phases[key as TProgramPhaseKey];
  //     }
  //   });

  //   Object.keys(clinicianProgram.days).forEach((key) => {
  //     if (key.includes("_") && !key.includes(clinicianClientId)) {
  //       delete clinicianProgram.days[key as TProgramDayKey];
  //     }
  //   });
  // }

  return clinicianProgram;
}

export async function getClinicianProgramsWithSubcollections(
  clinicianId: string,
): Promise<TClinicianProgram[]> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const programsRef = collection(clinicianRef, "programs");

    const programsQuery = query(programsRef, where("isSaved", "==", true));
    const programsSnap = await getDocs(
      programsQuery.withConverter(programConverter),
    );

    const programsData = programsSnap.docs.map((doc) => doc.data());

    return Promise.all(
      programsData.map(async (p) => {
        const { currentVersionRef } = p;
        const program = await _getProgramFromRef(currentVersionRef, true);
        if (program.creator !== "clinician") {
          throw new Error(
            "Program is not a clinician program, invalid program",
          );
        }

        return program;
      }),
    );
  } catch (error) {
    console.error("Error fetching clinician programs:", error);
    throw error;
  }
}
