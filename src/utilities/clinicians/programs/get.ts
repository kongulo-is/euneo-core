import {
  doc,
  DocumentReference,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TClinicianProgram, TProgramWrite } from "../../../types/programTypes";
import { programConverter, programDayConverter } from "../../converters";
import { _getProgramFromRef } from "../../programHelpers";

export async function getClinicianProgramWithDays(
  clinicianId: string,
  clinicianProgramId: string
): Promise<TClinicianProgram> {
  let programRef = doc(
    db,
    "clinicians",
    clinicianId,
    "programs",
    clinicianProgramId
  ) as DocumentReference<TProgramWrite>;

  const clinicianProgram = await _getProgramFromRef(programRef);

  if (!("clinicianId" in clinicianProgram)) {
    throw new Error("Program is not a clinician program");
  }

  return clinicianProgram;
}

export async function getClinicianProgramsWithDays(
  clinicianId: string
): Promise<TClinicianProgram[]> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const programsRef = collection(clinicianRef, "programs");
    const programsSnap = await getDocs(
      programsRef.withConverter(programConverter)
    );

    // for each program, get the days
    const daysSnap = await Promise.all(
      programsSnap.docs.map((doc) =>
        getDocs(collection(doc.ref, "days").withConverter(programDayConverter))
      )
    );
    // map the days to the programs
    const programs: TClinicianProgram[] = programsSnap.docs.map((doc, i) => {
      const days = Object.fromEntries(
        daysSnap[i].docs.map((doc) => [doc.id, doc.data()])
      );
      return {
        ...doc.data(),
        days,
        clinicianProgramId: doc.id,
        clinicianId,
        mode: "continuous",
      };
    });

    return programs;
  } catch (error) {
    console.error("Error fetching clinician programs:", error);
    throw error;
  }
}
