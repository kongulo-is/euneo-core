import {
  DocumentReference,
  getDoc,
  getDocs,
  collection,
  doc,
} from "firebase/firestore";

import { db } from "../firebase/db";
import { conditions } from "../constants/conditions";
import {
  TProgram,
  TProgramInfo,
  TProgramRead,
  TProgramWrite,
  isClinicProgramInfo,
  isClinicianProgramInfo,
  isEuneoProgramInfo,
  programConverter,
} from "../entities/program/program";
import {
  TClinicianProgramVersionIdentifiers,
  TEuneoProgramVersionIdentifiers,
  TProgramVersion,
  TProgramVersionRead,
  TProgramVersionWrite,
  deserializeProgramVersionPath,
  isClinicProgramVersionIdentifiers,
  isClinicianProgramVersionIdentifiers,
  programVersionConverter,
} from "../entities/program/version";
import {
  TProgramDay,
  TProgramDayKey,
  programDayConverter,
} from "../entities/program/programDay";
import {
  TProgramPhase,
  TProgramPhaseKey,
  TProgramPhaseRead,
  programPhaseConverter,
} from "../entities/program/programPhase";
import { TClientProgramDay } from "../entities/client/day";
import { TConditionId } from "../entities/global";
import { TClinician } from "../entities/clinician/clinician";

// TODO: is this function not already defined somewhere else?
async function _fetchProgramVersion(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >
): Promise<TProgramVersion> {
  const programSnap = await getDoc(
    programVersionRef.withConverter(programVersionConverter)
  );

  if (!programSnap.exists()) {
    throw new Error("Program does not exist.");
  }
  const programVersion = programSnap.data();

  return { ...programVersion, programVersionRef: programVersionRef };
}

// TODO: is this function not already defined somewhere else?
async function _fetchProgramBase(
  programRef: DocumentReference<TProgramRead, TProgramWrite>
): Promise<TProgramInfo> {
  const programSnap = await getDoc(programRef.withConverter(programConverter));

  if (!programSnap.exists()) {
    throw new Error("Program does not exist.");
  }
  const programData = programSnap.data();

  return { ...programData, programRef: programRef };
}

// TODO: is this function not already defined somewhere else? add description?
export async function _fetchDays(
  programRef: DocumentReference<TProgramVersionRead, TProgramVersionWrite>
): Promise<Record<TProgramDayKey, TProgramDay>> {
  const daySnapshots = await getDocs(
    collection(programRef, "days").withConverter(programDayConverter)
  );

  return Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

// TODO: is this function not already defined somewhere else? add description?
export async function _fetchPhases(
  programRef: DocumentReference<TProgramVersionRead, TProgramVersionWrite>,
  excludeMaintenancePhases: boolean = false
): Promise<Record<TProgramPhaseKey, TProgramPhaseRead>> {
  const phaseSnapshots = await getDocs(
    collection(programRef, "phases").withConverter(programPhaseConverter)
  );

  const sortedPhaseDocs = phaseSnapshots.docs.sort((a, b) => {
    const aId = parseInt(a.id.split("p")[1]);
    const bId = parseInt(b.id.split("p")[1]);
    return aId - bId;
  });

  // If first phase is continuous, we return without checking maintenance
  if (sortedPhaseDocs[0].data().mode === "continuous") {
    return Object.fromEntries(
      sortedPhaseDocs.map((doc) => [doc.id, doc.data()])
    );
  }
  // Return only non-maintenance phases if excludeMaintenancePhases is true
  if (excludeMaintenancePhases) {
    return Object.fromEntries(
      sortedPhaseDocs
        .filter((doc) => !doc.id.includes("m"))
        .map((doc) => [doc.id, doc.data()])
    );
  }

  let highestPhaseId = 0;
  let hasMaintainancePhase = false;

  const phases = Object.fromEntries(
    sortedPhaseDocs.map((doc) => {
      if (doc.id.includes("m")) {
        hasMaintainancePhase = true;
      }
      const phaseNumber = parseInt(doc.id.split("p")[1]);
      if (phaseNumber > highestPhaseId) {
        highestPhaseId = phaseNumber;
      }
      return [doc.id, doc.data()];
    })
  );

  // Add maintenance phase if there isn't one already
  if (!hasMaintainancePhase) {
    const lastPhase = phases[`p${highestPhaseId}`];
    phases["m1"] = {
      name: "Maintenance phase",
      daysDeprecated: lastPhase.daysDeprecated,
      days: lastPhase.days,
      mode: "maintenance",
      finalPhase: true,
    };
  }

  return phases;
}

export async function _getProgramFromRef(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  excludeMaintenancePhases: boolean = false
): Promise<TProgram> {
  try {
    const programVersionIdentifiers = deserializeProgramVersionPath(
      programVersionRef.path
    );

    let programRef: DocumentReference<TProgramRead, TProgramWrite> =
      programVersionRef.parent.parent!.withConverter(programConverter);

    const [programInfo, versionInfo, phases, days] = await Promise.all([
      _fetchProgramBase(programRef),
      _fetchProgramVersion(programVersionRef),
      _fetchPhases(programVersionRef, excludeMaintenancePhases),
      _fetchDays(programVersionRef),
    ]);

    // Adjust the returned type based on the program type
    if (isClinicianProgramVersionIdentifiers(programVersionIdentifiers)) {
      if (!isClinicianProgramInfo(programInfo)) {
        throw new Error(
          "Program is not a clinician program, invalid program info"
        );
      }
      return {
        programVersionIdentifiers,
        programVersionRef,
        days,
        phases,
        programInfo,
        versionInfo,
        creator: "clinician",
      };
    } else if (isClinicProgramVersionIdentifiers(programVersionIdentifiers)) {
      if (!isClinicProgramInfo(programInfo)) {
        throw new Error(
          "Program is not a clinic program, invalid program info"
        );
      }
      return {
        programVersionIdentifiers,
        programVersionRef,
        days,
        phases,
        programInfo,
        versionInfo,
        creator: "clinic",
      };
    } else {
      if (!isEuneoProgramInfo(programInfo)) {
        throw new Error("Program is not a euneo program, invalid program info");
      }
      return {
        programVersionIdentifiers,
        programVersionRef,
        days,
        phases,
        programInfo,
        versionInfo,
        creator: "euneo",
      };
    }
  } catch (error) {
    console.error("Error fetching program: ", error);
    return {} as TProgram;
  }
}
/**
 *
 * @param programVersionRef
 * @returns
 * TODO: this was a quick fix
 */
export async function _getProgramDetailsFromRef(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >
): Promise<{
  programVersionIdentifiers:
    | TEuneoProgramVersionIdentifiers
    | TClinicianProgramVersionIdentifiers;
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >;
  programInfo: TProgramInfo;
  versionInfo: TProgramVersion;
  creator: "euneo" | "clinician" | "clinic";
}> {
  try {
    const programVersionIdentifiers = deserializeProgramVersionPath(
      programVersionRef.path
    );

    let programRef: DocumentReference<TProgramRead, TProgramWrite> =
      programVersionRef.parent.parent!.withConverter(programConverter);

    const [programInfo, versionInfo] = await Promise.all([
      _fetchProgramBase(programRef),
      _fetchProgramVersion(programVersionRef),
    ]);

    // Adjust the returned type based on the program type
    if (isClinicianProgramVersionIdentifiers(programVersionIdentifiers)) {
      if (!isClinicianProgramInfo(programInfo)) {
        throw new Error(
          "Program is not a clinician program, invalid program info"
        );
      }
      return {
        programVersionIdentifiers,
        programVersionRef,
        programInfo,
        versionInfo,
        creator: "clinician",
      };
    } else if (isClinicProgramVersionIdentifiers(programVersionIdentifiers)) {
      if (!isClinicProgramInfo(programInfo)) {
        throw new Error(
          "Program is not a clinic program, invalid program info"
        );
      }
      return {
        programVersionIdentifiers,
        programVersionRef,
        programInfo,
        versionInfo,
        creator: "clinic",
      };
    } else {
      if (!isEuneoProgramInfo(programInfo)) {
        throw new Error("Program is not a euneo program, invalid program info");
      }
      return {
        programVersionIdentifiers,
        programVersionRef,
        programInfo,
        versionInfo,
        creator: "euneo",
      };
    }
  } catch (error) {
    console.error("Error fetching program: ", error);
    return {} as TProgram;
  }
}

/**
 * @description //TODO: add description
 * @param startDayIndex what day of the phase to start on (not the day of the program)
 * @returns
 */
export function createPhase(
  trainingDays: boolean[],
  program: TProgram,
  phaseId: TProgramPhaseKey,
  date?: Date,
  length?: number,
  startDayIndex?: number
): TClientProgramDay[] {
  // Get the phase from the program using the phaseId
  const phase = program.phases[phaseId];

  // Initialize an empty array to store the days of the phase
  let dayList = [] as Array<TClientProgramDay>;

  // Set the restIndex to the startDayIndex if it's provided, otherwise set it to 0
  let restIndex = startDayIndex || 0;

  // Set the date to the provided date if it's provided, otherwise set it to the current date
  let d = date ? date : new Date();

  // Set the iterator to the provided length if it's provided, otherwise set it to the phase length if it's defined, otherwise set it to 14
  const iterator = length ? length : phase?.length ? phase.length : 14;

  // Set the hours, minutes, seconds, and milliseconds of the date to 0
  d.setHours(0, 0, 0, 0);

  // Loop for the number of times specified by the iterator
  for (let i = 0; i < iterator; i++) {
    // Get the dayId from the phase days array at the index specified by restIndex modulo the length of the phase days array
    const dayId = phase.days[restIndex % phase.days.length];

    // Get the infoDay from the program days object using the dayId
    const infoDay = program.days[dayId.id as TProgramDayKey];

    // Determine if it's a rest day by checking if the day of the week (adjusted to start on Monday) is a training day
    const isRestDay = !trainingDays[(d.getDay() + 6) % 7];

    // Push a new day object to the dayList array
    dayList.push({
      dayId: dayId.id as TProgramDayKey,
      date: new Date(d),
      phaseId: phaseId,
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0),
      restDay: isRestDay,
    });

    // Increment the date by one day
    d.setDate(d.getDate() + 1);

    // If it's not a rest day, increment the restIndex
    !isRestDay && restIndex++;
  }

  // Return the dayList array
  return dayList;
}

export function incrementBaseVersion(version: string): `${number}.${number}` {
  // Split the string at the period
  const parts = version.split(".");

  // Convert the first part to a number and increment it
  const incremented = parseInt(parts[0]) + 1;

  // Concatenate the incremented number with '.0'
  return `${incremented}.0`;
}

/**
 *
 * @param version
 * @description This function is used when creating a new version of a program.
 * It takes a version string and returns a new version string with the format "1.0 or 1.uid"
 * where 1 is the current version number and uid is a unique identifier from the programs collection.
 * @returns a new version string with the format "1.0 or 1.uid"
 */
export function createModifiedVersion(version: string) {
  // Split the string at the period
  const parts = version.split(".");

  // Convert the first part to a number
  const base = parseInt(parts[0]);

  if (parseInt(parts[1]) === 0) {
    const docRef = doc(collection(db, "programs"));

    return `${base}.${docRef.id}`;
  }

  return version;
}

export function getProgramName(programInfo: {
  name?: string;
  conditionId: TConditionId | null;
}) {
  if (programInfo.name) return programInfo.name;
  else if (programInfo.conditionId) return conditions[programInfo.conditionId];
  else return "";
}

export function getProgramCreator(program: TProgram, clinician: TClinician) {
  if (program.creator === "clinician") {
    return clinician.name || clinician.email;
  } else if (program.creator === "clinic") {
    return (
      clinician.clinics?.find(
        (c) =>
          c.clinicIdentifiers.clinics ===
          program.programVersionIdentifiers.clinics
      )?.name || "Clinic"
    );
  } else if (program.creator === "euneo") {
    return "Euneo Health";
  } else {
    return "";
  }
}

export function getProgramCondition(conditionId: TConditionId | null) {
  if (conditionId) return conditions[conditionId];
  else return "";
}

export function getProgramNameForApp(programInfo: {
  name?: string;
  conditionId: TConditionId | null;
}) {
  // Only show the name of Euneo programs
  if (programInfo.conditionId && programInfo.name) return programInfo.name;
  else if (programInfo.conditionId) return conditions[programInfo.conditionId];
  else return "";
}
