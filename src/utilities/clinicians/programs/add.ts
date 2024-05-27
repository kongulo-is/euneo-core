import { doc, collection, setDoc, DocumentReference } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TClinicianProgram,
  TProgramPhaseRead,
  TProgramPhaseKey,
  TProgramDayKey,
  TProgramWrite,
  TProgramVersionWrite,
} from "../../../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "../../converters";

export async function createClinicianProgram(
  clinicianProgramRead: TProgramRead,
  phases: Record<TProgramPhaseKey, TProgramPhaseRead>,
  days: Record<TProgramDayKey, TProgramDayRead>,
  clinicianId: string,
  clinicianProgramId?: string // used to overwrite the program (used when saving program)
): Promise<TClinicianProgram> {
  console.log("clinicianProgramRead", clinicianProgramRead);

  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);

    // Program reference (If program exists, overwrite it, else create new program)
    const programRef = clinicianProgramId
      ? doc(clinicianRef, "programs", clinicianProgramId)
      : (doc(
          collection(clinicianRef, "programs")
        ) as DocumentReference<TProgramVersionWrite>);

    // Program version ref
    const currentProgramRef = doc(
      programRef,
      "versions",
      "1.0"
    ) as DocumentReference<TProgramWrite>;
    await setDoc(programRef, {
      currentVersion: currentProgramRef,
    });

    await Promise.all([
      setDoc(
        currentProgramRef.withConverter(programConverter),
        clinicianProgramRead
      ),
    ]);

    const daysRef = collection(currentProgramRef, "days");

    await Promise.all(
      Object.keys(days).map((id) => {
        const dayId = id as `d${number}`;
        return setDoc(
          doc(daysRef.withConverter(programDayConverter), dayId),
          days[dayId],
          { merge: true }
        );
      })
    );

    const phasesRef = collection(currentProgramRef, "phases");

    await Promise.all(
      Object.keys(phases).map((id) => {
        const phaseId = id as `p${number}`;
        const phase = { ...phases[phaseId], programId: programRef.id };
        return setDoc(
          doc(phasesRef.withConverter(programPhaseConverter), phaseId),
          phase,
          { merge: true }
        );
      })
    );

    const clinicianProgram: TClinicianProgram = {
      ...clinicianProgramRead,
      phases,
      days,
      clinicianProgramId: programRef.id,
      clinicianId,
      version: "1.0",
    };

    return clinicianProgram;
  } catch (error) {
    console.error("Error creating clinician program:", error, {
      clinicianProgramRead,
      days,
      clinicianId,
    });
  }
  throw new Error("Error creating clinician program");
}
