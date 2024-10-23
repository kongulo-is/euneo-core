import { DocumentReference, doc, collection, setDoc } from "firebase/firestore";
import {
  TClinicianProgramRead,
  TProgramRead,
  TProgramWrite,
  programConverter,
} from "../../../entities/program/program";
import {
  TNextPhase,
  TNextPhaseForm,
  TProgramPhaseForm,
  TProgramPhaseKey,
  TProgramPhaseRead,
  TProgramPhaseWrite,
  programPhaseConverter,
} from "../../../entities/program/programPhase";

import {
  TProgramVersion,
  TProgramVersionRead,
  TProgramVersionWrite,
} from "../../../entities/program/version";
import {
  TProgramDayKey,
  TProgramDayRead,
  TProgramDayWrite,
  programDayConverter,
} from "../../../entities/program/programDay";
import { Collection } from "../../../entities/global";
import { getProgram } from "../../programs/get";
import {
  removeClinicianProgramDay,
  removeClinicianProgramPhase,
} from "./delete";

export function _convertNextPhase(
  nextPhase: TNextPhaseForm[],
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >
): TNextPhase[] {
  return nextPhase.map((phase) => {
    const nextPhaseRef = doc(
      programVersionRef,
      "phases",
      phase.phaseId
    ) as DocumentReference<TProgramPhaseRead, TProgramPhaseWrite>;

    return {
      phaseId: phase.phaseId,
      length: phase.length,
      maxPainLevel: phase.maxPainLevel,
      minPainLevel: phase.minPainLevel,
      reference: nextPhaseRef,
    };
  });
}

export async function _saveDays(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  days: Record<TProgramDayKey, TProgramDayRead>
) {
  const daysRef = collection(programVersionRef, Collection.Days);
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
}

export async function _savePhases(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  phases: Record<TProgramPhaseKey, TProgramPhaseForm>,
  highestPhaseId?: TProgramPhaseKey | null
): Promise<Record<TProgramPhaseKey, TProgramPhaseRead>> {
  const phasesRef = collection(programVersionRef, Collection.Phases);
  const phasesRead: Record<TProgramPhaseKey, TProgramPhaseRead> = {};

  await Promise.all(
    Object.keys(phases).map(async (id) => {
      const phaseId = id as `p${number}`;
      const phase = phases[phaseId];

      let phaseRead: TProgramPhaseRead;
      if (phase.mode === "finite" && phase.length && phase.nextPhase) {
        phaseRead = {
          name: phase.name || "",
          days: phase.days.map(
            (day) =>
              doc(
                collection(programVersionRef, Collection.Days),
                day
              ) as DocumentReference<TProgramDayRead, TProgramDayWrite>
          ),
          daysDeprecated: phase.days,
          nextPhase: _convertNextPhase(phase.nextPhase, programVersionRef),
          mode: phase.mode,
          length: phase.length,
          finalPhase: phase.finalPhase,
        };
      } else if (phase.mode === "continuous" || phase.mode === "maintenance") {
        if (highestPhaseId && highestPhaseId !== phaseId) {
          phase.hidden = true;
        }

        phaseRead = {
          name: phase.name || "",
          days: phase.days.map(
            (day) =>
              doc(
                collection(programVersionRef, Collection.Days),
                day
              ) as DocumentReference<TProgramDayRead, TProgramDayWrite>
          ),
          daysDeprecated: phase.days,
          mode: phase.mode,
          finalPhase: phase.finalPhase,
        };
      } else {
        throw new Error("Invalid program phase");
      }

      await setDoc(
        doc(phasesRef.withConverter(programPhaseConverter), phaseId),
        phaseRead
        // { merge: true },
      );

      phasesRead[phaseId] = phaseRead;
    })
  );

  return phasesRead;
}

export async function _saveProgramInfo(
  programRef: DocumentReference<TProgramRead, TProgramWrite>,
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,

  isSaved: boolean
) {
  const programInfo: TClinicianProgramRead = {
    currentVersionRef: programVersionRef,
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
    isSaved: isSaved ?? false,
    isArchived: false,
    programRef: programRef,
  };

  await setDoc(programRef, programInfo);

  return programInfo;
}

export async function _saveVersionInfo(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  programVersionRead: TProgramVersionRead
): Promise<TProgramVersion> {
  await setDoc(programVersionRef, programVersionRead);
  return {
    ...programVersionRead,
    programVersionRef,
  };
}

export async function _removeUnusedPhasesAndDays(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  newPhases: Record<TProgramPhaseKey, TProgramPhaseForm>,
  newDays: Record<TProgramDayKey, TProgramDayRead>
) {
  const oldClinicianProgram = await getProgram(programVersionRef);
  if (oldClinicianProgram.creator !== "clinician") {
    throw new Error("Program is not a clinician program");
  }

  const { phases: oldPhases, days: oldDays } = oldClinicianProgram;

  const newPhaseKeys = new Set(Object.keys(newPhases));
  const newDayKeys = new Set(Object.keys(newDays));

  const oldPhaseKeys = Object.keys(oldPhases);
  const oldDayKeys = Object.keys(oldDays);

  // Find keys in oldPhases that are not in newPhases
  const unusedPhaseKeys = oldPhaseKeys.filter((key) => !newPhaseKeys.has(key));

  // Find keys in oldDays that are not in newDays
  const unusedDayKeys = oldDayKeys.filter((key) => !newDayKeys.has(key));

  return await Promise.all([
    unusedPhaseKeys.map(async (key) => {
      const phaseKey: TProgramPhaseKey = key as TProgramPhaseKey;
      return await removeClinicianProgramPhase(programVersionRef, phaseKey);
    }),
    unusedDayKeys.map(async (key) => {
      const dayKey: TProgramDayKey = key as `d${number}`;
      return await removeClinicianProgramDay(programVersionRef, dayKey);
    }),
  ])
    .then(() => true)
    .catch((err) => {
      console.error(err);
      return false;
    });
}
