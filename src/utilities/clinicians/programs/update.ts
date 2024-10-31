import { doc, DocumentReference, setDoc, Timestamp } from "firebase/firestore";

import {
  createProgramVersionRef,
  deserializeProgramVersionPath,
  isClinicianProgramVersionIdentifiers,
  programVersionConverter,
  TProgramVersion,
  TProgramVersionRead,
  TProgramVersionWrite,
} from "../../../entities/program/version";
import { TClinicianProgram } from "../../../entities/program/program";
import {
  TProgramPhaseForm,
  TProgramPhaseKey,
} from "../../../entities/program/programPhase";
import { Collection, TConditionId } from "../../../entities/global";

import { updateDoc } from "../../updateDoc";
import { _saveDays, _savePhases } from "./_helpers";
import {
  TProgramDayKey,
  TProgramDayRead,
} from "../../../entities/program/programDay";

// Function to find the highest number in the list of objects
function _findHighestContinuousPhaseId(
  list: [TProgramPhaseKey, TProgramPhaseForm][]
): TProgramPhaseKey | null {
  let maxIdNumber = -Infinity;

  if (list.length === 0) return null;

  list.forEach((phaseEntry) => {
    const idNumber = parseInt(phaseEntry[0].substring(1)); // Extract numeric part

    if (!isNaN(idNumber) && phaseEntry[1].mode !== "finite") {
      maxIdNumber = Math.max(maxIdNumber, idNumber);
    }
  });

  const firstEntry = list[0];
  const prefix = firstEntry[0].substring(0, 1) as "p";

  return maxIdNumber === -Infinity ? null : `${prefix}${maxIdNumber}`;
}

export async function createNewClinicianProgramVersion(
  currentClinicianProgram: TClinicianProgram,
  programVersionRead: TProgramVersionRead,
  newVersion: string,
  phases: Record<TProgramPhaseKey, TProgramPhaseForm>,
  days: Record<TProgramDayKey, TProgramDayRead>,
  clinicianProgramId: string
): Promise<TClinicianProgram> {
  try {
    const { programRef } = currentClinicianProgram.programInfo;

    const newProgramVersionRef: DocumentReference<
      TProgramVersionRead,
      TProgramVersionWrite
    > = doc(programRef, Collection.Versions, newVersion).withConverter(
      programVersionConverter
    );

    const programVersionIdentifiers = deserializeProgramVersionPath(
      newProgramVersionRef.path
    );
    if (!isClinicianProgramVersionIdentifiers(programVersionIdentifiers)) {
      throw new Error("Invalid program identifiers");
    }

    const lastUpdatedAt = new Date();

    // Update current version
    await updateDoc(programRef, {
      currentVersionRef: newProgramVersionRef,
      lastUpdatedAt: Timestamp.fromDate(lastUpdatedAt),
    });

    // convert and create new program version.
    await setDoc(newProgramVersionRef, programVersionRead);

    await _saveDays(newProgramVersionRef, days);

    const phasesRead = await _savePhases(newProgramVersionRef, phases);

    const clinicianProgram: TClinicianProgram = {
      ...currentClinicianProgram,
      programInfo: {
        ...currentClinicianProgram.programInfo,
        lastUpdatedAt: lastUpdatedAt,
        currentVersionRef: newProgramVersionRef,
      },
      versionInfo: {
        ...programVersionRead,
        programVersionRef: newProgramVersionRef,
      },
      days,
      phases: phasesRead,
      creator: "clinician",
      programVersionIdentifiers,
      programVersionRef: newProgramVersionRef,
    };

    return clinicianProgram;
  } catch (error) {
    console.error(
      "Error creating new version: ",
      error,
      currentClinicianProgram,
      days,
      clinicianProgramId
    );
  }
  throw new Error("Error updating clinician program");
}

export async function createModifiedClinicianProgramVersion(
  currentProgram: TClinicianProgram,
  newProgramVersionRead: TProgramVersionRead,
  phases: Record<TProgramPhaseKey, TProgramPhaseForm>,
  days: Record<TProgramDayKey, TProgramDayRead>,
  version: string
): Promise<TClinicianProgram> {
  try {
    const { programRef } = currentProgram.programInfo;

    const newProgramVersionRef = createProgramVersionRef({
      programRef,
      versions: version,
    });

    // convert and create new program version.
    await setDoc(newProgramVersionRef, newProgramVersionRead);

    await _saveDays(newProgramVersionRef, days);

    const phaseEntries = Object.entries(phases) as [
      TProgramPhaseKey,
      TProgramPhaseForm,
    ][];
    const highestPhaseId = _findHighestContinuousPhaseId(phaseEntries);

    const phasesRead = await _savePhases(
      newProgramVersionRef,
      phases,
      highestPhaseId
    );

    const newProgramVersion: TProgramVersion = {
      ...newProgramVersionRead,
      programVersionRef: newProgramVersionRef,
    };
    const programVersionIdentifiers = deserializeProgramVersionPath(
      newProgramVersionRef.path
    );

    if (!isClinicianProgramVersionIdentifiers(programVersionIdentifiers)) {
      throw new Error("Invalid program version identifiers");
    }

    const clinicianProgram: TClinicianProgram = {
      programInfo: {
        ...currentProgram.programInfo,
      },
      versionInfo: newProgramVersion,
      days,
      phases: phasesRead,
      creator: "clinician",
      programVersionIdentifiers: programVersionIdentifiers,
      programVersionRef: newProgramVersionRef,
    };

    return clinicianProgram;
  } catch (error) {
    console.error(
      "Error creating new version: ",
      error,
      currentProgram,
      days,
      days
    );
  }
  throw new Error("Error updating clinician program");
}

export async function renameClinicianProgram(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  programName: string,
  conditionId: TConditionId | null,
  variation: string
) {
  try {
    // Update condition and variation
    await updateDoc(programVersionRef, {
      name: programName,
      conditionId,
      variation,
    });

    return true;
  } catch (error) {
    return false;
  }
}
