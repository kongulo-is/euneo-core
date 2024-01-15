import { doc, DocumentReference, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TClinicianProgram,
  TProgramWrite,
  TProgramDayWrite,
  TProgramPhaseRead,
  TProgramPhaseWrite,
  TProgramPhase,
} from "../../../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "../../converters";

export async function updateClinicianProgram(
  clinicianProgram: TProgramRead,
  phases: Record<`p${number}`, TProgramPhaseRead>,
  days: Record<`d${number}`, TProgramDayRead>,
  clinicianProgramId: string,
  clinicianId: string
): Promise<TClinicianProgram> {
  try {
    const programRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId
    ) as DocumentReference<TProgramWrite>;

    // convert and update program.
    const programConverted = programConverter.toFirestore(clinicianProgram);
    await updateDoc(programRef, programConverted);

    // convert and update program days and phases.
    const day = programDayConverter.toFirestore(days["d1"]);
    const dayRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "days",
      "d1"
    ) as DocumentReference<TProgramDayWrite>;
    await updateDoc(dayRef, day);

    const phase = programPhaseConverter.toFirestore(phases["p1"]);
    const phaseRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "phases",
      "p1"
    ) as DocumentReference<TProgramPhaseWrite>;
    await updateDoc(phaseRef, phase);

    return {
      ...clinicianProgram,
      phases,
      days,
      clinicianProgramId,
      clinicianId,
    };
  } catch (error) {
    console.error(
      "Error updating clinician program: ",
      error,
      clinicianProgram,
      days,
      clinicianProgramId,
      clinicianId
    );
  }
  throw new Error("Error updating clinician program");
}

export async function addUniqueClientDayToClinicianProgram(
  clinicianProgram: TClinicianProgram,
  newDay: TProgramDayRead,
  clinicianProgramId: string,
  clinicianId: string,
  clinicianClientId: string
): Promise<TClinicianProgram> {
  try {
    const { days, phases } = clinicianProgram;
    // Create new day key clinicianClientId_d?
    const customDaysCount = days
      ? Object.keys(days).filter((d) => d.includes(clinicianClientId))
      : [];

    const newDayKey = `${clinicianClientId}_d${
      customDaysCount.length + 1
    }` as `${string}_d${number}`;

    // Create new phase key clinicianClientId_d?
    const customPhasesCount = phases
      ? Object.keys(phases).filter((p) => p.includes(clinicianClientId))
      : [];
    const newPhaseKey = `${clinicianClientId}_p${customPhasesCount.length + 1}`;

    // convert and update program days and phases.
    const day = programDayConverter.toFirestore(newDay);
    const dayRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "days",
      newDayKey
    ) as DocumentReference<TProgramDayWrite>;
    await setDoc(dayRef, day);

    const newPhase: TProgramPhaseRead = {
      days: [newDayKey],
      finalPhase: true,
      mode: "continuous",
      programId: clinicianProgramId,
    };

    const phase = programPhaseConverter.toFirestore(newPhase);
    const phaseRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId,
      "phases",
      newPhaseKey
    ) as DocumentReference<TProgramPhaseWrite>;
    await setDoc(phaseRef, phase);

    return {
      ...clinicianProgram,
      phases: {
        ...phases,
        [newPhaseKey]: newPhase,
      },
      days: {
        ...days,
        [newDayKey]: newDay,
      },
      clinicianProgramId,
      clinicianId,
    };
  } catch (error) {
    console.error(
      "Error updating clinician program: ",
      error,
      days,
      clinicianProgramId,
      clinicianId
    );
    throw new Error("Error updating clinician program");
  }
}
