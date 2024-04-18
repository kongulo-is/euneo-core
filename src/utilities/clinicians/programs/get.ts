import {
  doc,
  DocumentReference,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClinicianProgram,
  TProgramBase,
  TProgramDayKey,
  TProgramPhaseKey,
  TProgramWrite,
} from "../../../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
  programVersionConverter,
} from "../../converters";
import { _getProgramFromRef } from "../../programHelpers";

export async function getClinicianProgramWithDays(
  clinicianId: string,
  clinicianProgramId: string,
  version: string,
  clinicianClientId?: string
): Promise<TClinicianProgram> {
  let programRef = doc(
    db,
    "clinicians",
    clinicianId,
    "programs",
    clinicianProgramId,
    "versions",
    version
  ) as DocumentReference<TProgramWrite>;

  const clinicianProgram = await _getProgramFromRef(programRef);

  if (!("clinicianId" in clinicianProgram)) {
    throw new Error("Program is not a clinician program");
  }

  // TODO: Review á filteringu hér
  if (clinicianClientId) {
    Object.keys(clinicianProgram.phases).forEach((key) => {
      if (key.includes("_") && !key.includes(clinicianClientId)) {
        delete clinicianProgram.phases[key as TProgramPhaseKey];
      }
    });

    Object.keys(clinicianProgram.days).forEach((key) => {
      if (key.includes("_") && !key.includes(clinicianClientId)) {
        delete clinicianProgram.days[key as TProgramDayKey];
      }
    });
  }

  return clinicianProgram;
}

export async function getClinicianProgramsWithSubcollections(
  clinicianId: string
): Promise<TClinicianProgram[]> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const programsRef = collection(clinicianRef, "programs");
    const programsSnap = await getDocs(
      programsRef.withConverter(programVersionConverter)
    );
    const programsData = programsSnap.docs.map((doc) => doc.data());
    const programsCurrentVersionSnap = await Promise.all(
      programsData.map(async (program) => {
        return await getDoc(
          doc(
            db,
            "clinicians",
            program.clinicianId,
            "programs",
            program.programId,
            "versions",
            program.currentVersion
          ).withConverter(programConverter)
        );
      })
    );

    // for each program, get the phases and days
    // TODO: Try doing both at the same time?
    const phasesSnap = await Promise.all(
      programsCurrentVersionSnap.map((doc) =>
        getDocs(
          collection(doc.ref, "phases").withConverter(programPhaseConverter)
        )
      )
    );
    const daysSnap = await Promise.all(
      programsCurrentVersionSnap.map((doc) =>
        getDocs(collection(doc.ref, "days").withConverter(programDayConverter))
      )
    );
    // map the days to the programs
    const programs: TClinicianProgram[] = programsCurrentVersionSnap.map(
      (doc, i) => {
        const phases = Object.fromEntries(
          phasesSnap[i].docs.map((doc) => [doc.id, doc.data()])
        );
        const days = Object.fromEntries(
          daysSnap[i].docs.map((doc) => [doc.id, doc.data()])
        );
        console.log("Ids: ", clinicianId, doc.ref.parent.parent?.id, doc.id);

        return {
          ...(doc.data() as TProgramBase),
          phases,
          days,
          clinicianProgramId: doc.ref.parent.parent?.id || "",
          clinicianId,
          version: doc.id,
        };
      }
    );

    return programs;
  } catch (error) {
    console.error("Error fetching clinician programs:", error);
    throw error;
  }
}
