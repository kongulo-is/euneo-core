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
  _getProgramDetailsFromRef,
  _getProgramFromRef,
} from "../../programHelpers";
import {
  TClinicProgram,
  TClinicProgramWithoutSubCollections,
  TClinicianProgram,
  programConverter,
} from "../../../entities/program/program";
import {
  TProgramVersionRead,
  TProgramVersionWrite,
} from "../../../entities/program/version";

export async function getClinicProgramWithDays(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,

  excludeMaintenance: boolean = false
): Promise<TClinicProgram> {
  const clinicProgram = await _getProgramFromRef(
    programVersionRef,
    excludeMaintenance
  );

  return clinicProgram;
}

export async function getClinicProgramsBase(
  clinicId: string
): Promise<TClinicProgramWithoutSubCollections[]> {
  try {
    const clinicRef = doc(db, "clinics", clinicId);
    const programsRef = collection(clinicRef, "programs");

    const programsQuery = query(programsRef, where("isSaved", "==", true));
    const programsSnap = await getDocs(
      programsQuery.withConverter(programConverter)
    );

    const programsData = programsSnap.docs.map((doc) => doc.data());

    return Promise.all(
      programsData.map(async (p) => {
        const { currentVersionRef } = p;
        const programBase = await _getProgramDetailsFromRef(currentVersionRef);

        const program = {
          ...programBase,
          // TODO: remove as
        };

        return program;
      })
    );
  } catch (error) {
    console.error("Error fetching clinic programs:", error);
    throw error;
  }
}

export async function getClinicProgramsWithSubcollections(
  clinicId: string
): Promise<TClinicianProgram[]> {
  try {
    const clinicRef = doc(db, "clinics", clinicId);
    const programsRef = collection(clinicRef, "programs");

    const programsQuery = query(programsRef, where("isSaved", "==", true));
    const programsSnap = await getDocs(
      programsQuery.withConverter(programConverter)
    );

    const programsData = programsSnap.docs.map((doc) => doc.data());

    return Promise.all(
      programsData.map(async (p) => {
        const { currentVersionRef } = p;

        const program = await _getProgramFromRef(currentVersionRef, true);

        return program;
      })
    );
  } catch (error) {
    console.error("Error fetching clinic programs:", error);
    throw error;
  }
}
