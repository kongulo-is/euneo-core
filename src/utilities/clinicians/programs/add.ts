import {
  TClinicianProgram,
  TProgramRead,
  TProgramWrite,
  programConverter,
} from "../../../entities/program/program";
import {
  TProgramPhaseForm,
  TProgramPhaseKey,
} from "../../../entities/program/programPhase";
import {
  TProgramDayKey,
  TProgramDayRead,
} from "../../../entities/program/programDay";
import {
  TProgramVersionRead,
  createProgramVersionRef,
  deserializeProgramVersionPath,
  isClinicianProgramVersionIdentifiers,
} from "../../../entities/program/version";
import {
  _saveProgramInfo,
  _saveDays,
  _savePhases,
  _saveVersionInfo,
  _removeUnusedPhasesAndDays,
} from "./_helpers";
import { DocumentReference } from "firebase/firestore";

export async function createClinicianProgram(
  programVersionRead: TProgramVersionRead,
  clinicianId: string,
  version: string,
  phases: Record<TProgramPhaseKey, TProgramPhaseForm>,
  days: Record<TProgramDayKey, TProgramDayRead>,
  isSaved: boolean,
  clinicianProgramId?: string
): Promise<TClinicianProgram> {
  try {
    const programVersionRef = createProgramVersionRef({
      clinicians: clinicianId,
      programs: clinicianProgramId,
      versions: version,
    });

    // We can guarentee that the parent of programVersionRef is a program ref
    const programRef: DocumentReference<TProgramRead, TProgramWrite> =
      programVersionRef.parent.parent!.withConverter(programConverter);

    const programVersionIdentifiers = deserializeProgramVersionPath(
      programVersionRef.path
    );

    // If program id has been used to create a program, we need to remove unused phases and days if there are any
    if (clinicianProgramId) {
      await _removeUnusedPhasesAndDays(programVersionRef, phases, days);
    }

    if (!isClinicianProgramVersionIdentifiers(programVersionIdentifiers)) {
      throw new Error("Invalid program version identifiers");
    }

    const programInfo = await _saveProgramInfo(
      programRef,
      programVersionRef,
      isSaved
    );
    const versionInfo = await _saveVersionInfo(
      programVersionRef,
      programVersionRead
    );
    await _saveDays(programVersionRef, days);
    const phasesRead = await _savePhases(programVersionRef, phases);

    const clinicianProgram: TClinicianProgram = {
      programInfo: programInfo,
      versionInfo: versionInfo,
      days,
      phases: phasesRead,
      creator: "clinician",
      programVersionIdentifiers,
      programVersionRef: programVersionRef,
    };

    return clinicianProgram;
  } catch (error) {
    console.error("Error creating clinician program:", error, {
      programVersionRead,
      days,
      clinicianId,
    });
    throw new Error("Error creating clinician program");
  }
}
