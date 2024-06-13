import {
  collection,
  doc,
  DocumentReference,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TClinicianProgram,
  TProgramWrite,
  TProgramPhaseRead,
  TProgramPhaseKey,
  TProgramDayKey,
  TProgramVersionWrite,
} from "../../../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "../../converters";
import { updateDoc } from "../../updateDoc";
import { TConditionId } from "../../../types/baseTypes";

export async function createNewClinicianProgramVersion(
  clinicianProgram: TProgramRead,
  phases: Record<TProgramPhaseKey, TProgramPhaseRead>,
  days: Record<TProgramDayKey, TProgramDayRead>,
  clinicianProgramId: string,
  clinicianId: string,
  createdAt?: Date
): Promise<TClinicianProgram> {
  try {
    const programRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgramId
    ) as DocumentReference<TProgramVersionWrite>;
    const newProgramVersionRef = doc(
      programRef,
      "versions",
      clinicianProgram.version
    ) as DocumentReference<TProgramWrite>;
    // Update current version
    await updateDoc(programRef, {
      currentVersion: newProgramVersionRef,
      lastUpdatedAt: Timestamp.fromDate(new Date()),
    });
    // convert and create new program version.
    const programVersionConverted =
      programConverter.toFirestore(clinicianProgram);
    await setDoc(newProgramVersionRef, programVersionConverted);
    // create days and phases for new version
    const daysRef = collection(newProgramVersionRef, "days");

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
    const phasesRef = collection(newProgramVersionRef, "phases");

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
    return {
      ...clinicianProgram,
      phases,
      days,
      clinicianProgramId,
      clinicianId,
      lastUpdatedAt: new Date(),
      ...(createdAt && { createdAt }),
    };
  } catch (error) {
    console.error(
      "Error creating new version: ",
      error,
      clinicianProgram,
      days,
      clinicianProgramId,
      clinicianId
    );
  }
  throw new Error("Error updating clinician program");
}

export async function createModifiedClinicianProgramVersion(
  clinicianProgram: TProgramRead,
  phases: Record<TProgramPhaseKey, TProgramPhaseRead>,
  days: Record<TProgramDayKey, TProgramDayRead>,
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
    ) as DocumentReference<TProgramVersionWrite>;
    const newProgramVersionRef = doc(
      programRef,
      "versions",
      clinicianProgram.version
    ) as DocumentReference<TProgramWrite>;
    // convert and create new program version.
    const programVersionConverted =
      programConverter.toFirestore(clinicianProgram);
    await setDoc(newProgramVersionRef, programVersionConverted);
    // create days and phases for new version
    const daysRef = collection(newProgramVersionRef, "days");

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
    const phasesRef = collection(newProgramVersionRef, "phases");

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
    return {
      ...clinicianProgram,
      phases,
      days,
      clinicianProgramId,
      clinicianId,
    };
  } catch (error) {
    // console.error(
    //   "Error creating new version: ",
    //   error,
    //   clinicianProgram,
    //   days,
    //   clinicianProgramId,
    //   clinicianId
    // );
  }
  throw new Error("Error updating clinician program");
}

export async function renameClinicianProgram(
  clinicianProgram: TClinicianProgram,
  clinicianId: string,
  programName: string,
  conditionId: TConditionId | null,
  variation: string
) {
  try {
    const programRef = doc(
      db,
      "clinicians",
      clinicianId,
      "programs",
      clinicianProgram.clinicianProgramId,
      "versions",
      clinicianProgram.version
    ) as DocumentReference<TProgramWrite>;

    // Update condition and variation
    await updateDoc(programRef, {
      name: programName,
      conditionId,
      variation,
    });

    return true;
  } catch (error) {
    return false;
  }
}

// export async function addUniqueClientDayToClinicianProgram(
//   clinicianProgram: TClinicianProgram,
//   newDay: TProgramDayRead,
//   clinicianProgramId: string,
//   clinicianId: string,
//   clinicianClientId: string
// ): Promise<{
//   clinicianProgram: TClinicianProgram;
//   newPhase: TProgramPhaseKey;
// }> {
//   try {
//     const { days, phases } = clinicianProgram;
//     // Create new day key clinicianClientId_d?
//     const customDaysCount = days
//       ? Object.keys(days).filter((d) => d.includes(clinicianClientId))
//       : [];

//     const newDayKey = `${clinicianClientId}_d${
//       customDaysCount.length + 1
//     }` as TProgramDayKey;

//     // Create new phase key clinicianClientId_d?
//     const customPhasesCount = phases
//       ? Object.keys(phases).filter((p) => p.includes(clinicianClientId))
//       : [];
//     const newPhaseKey = `${clinicianClientId}_p${
//       customPhasesCount.length + 1
//     }` as TProgramPhaseKey;

//     // convert and update program days and phases.
//     const day = programDayConverter.toFirestore(newDay);
//     const dayRef = doc(
//       db,
//       "clinicians",
//       clinicianId,
//       "programs",
//       clinicianProgramId,
//       "days",
//       newDayKey
//     ) as DocumentReference<TProgramDayWrite>;
//     await setDoc(dayRef, day);

//     const newPhase: TProgramPhaseRead = {
//       days: [newDayKey],
//       finalPhase: true,
//       mode: "continuous",
//       programId: clinicianProgramId,
//     };

//     const phase = programPhaseConverter.toFirestore(newPhase);
//     const phaseRef = doc(
//       db,
//       "clinicians",
//       clinicianId,
//       "programs",
//       clinicianProgramId,
//       "phases",
//       newPhaseKey
//     ) as DocumentReference<TProgramPhaseWrite>;
//     await setDoc(phaseRef, phase);

//     // return updated clinician program and new phase
//     return {
//       clinicianProgram: {
//         ...clinicianProgram,
//         days: {
//           ...days,
//           [newDayKey]: newDay,
//         },
//         phases: {
//           ...phases,
//           [newPhaseKey]: newPhase,
//         },
//       },
//       newPhase: newPhaseKey,
//     };
//   } catch (error) {
//     console.error(
//       "Error updating clinician program: ",
//       error,
//       clinicianProgramId,
//       clinicianId
//     );
//     throw new Error("Error updating clinician program");
//   }
// }
