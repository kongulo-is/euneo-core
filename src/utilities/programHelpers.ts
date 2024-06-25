import {
  DocumentReference,
  getDoc,
  getDocs,
  collection,
  doc,
} from "firebase/firestore";
import { TConditionId, TEuneoProgramId } from "../types/baseTypes";
import {
  TProgramWrite,
  TProgram,
  TProgramWithSubCollections,
  TProgramPhase,
  TProgramPhaseKey,
} from "../types/programTypes";
import {
  oldProgramConverter,
  oldProgramDayConverter,
  oldProgramPhaseConverter,
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "./converters";
import { TClientProgramDay } from "../types/clientTypes";
import { db } from "../firebase/db";
import { conditions } from "../constants/conditions";

export async function _fetchProgramBase(
  programRef: DocumentReference<TProgramWrite>
) {
  const programSnap = await getDoc(programRef.withConverter(programConverter));
  if (!programSnap.exists()) {
    throw new Error("Program does not exist.");
  }
  const programData = programSnap.data();
  return programData;
}

export async function _fetchDays(programRef: DocumentReference) {
  const daySnapshots = await getDocs(
    collection(programRef, "days").withConverter(programDayConverter)
  );

  return Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

export async function _fetchPhases(
  programRef: DocumentReference,
  excludeMaintenancePhases: boolean = false
): Promise<{
  [k: string]: TProgramPhase;
}> {
  const phaseSnapshots = await getDocs(
    collection(programRef, "phases").withConverter(programPhaseConverter)
  );

  // Return only non-maintenance phases if excludeMaintenancePhases is true
  if (excludeMaintenancePhases) {
    return Object.fromEntries(
      phaseSnapshots.docs
        .filter((doc) => !doc.id.includes("m"))
        .map((doc) => [doc.id, doc.data()])
    );
  }

  let highestPhaseId = 0;
  let hasMaintainancePhase = false;

  const phases = Object.fromEntries(
    phaseSnapshots.docs.map((doc) => {
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
      days: lastPhase.days,
      description: "Maintainance phase",
      mode: "continuous",
      finalPhase: true,
      programId: lastPhase.programId,
      version: lastPhase.version,
    };
  }

  return phases;
}

export async function _getProgramFromRef(
  programRef: DocumentReference<TProgramWrite>,
  excludeMaintenancePhases: boolean = false
): Promise<TProgram> {
  const [programBase, phases, days] = await Promise.all([
    _fetchProgramBase(programRef),
    _fetchPhases(programRef, excludeMaintenancePhases),
    _fetchDays(programRef),
  ]);

  const programId = programRef.parent.parent!.id;

  const programMode: TProgramWithSubCollections = {
    ...programBase,
    days,
    phases,
  };

  let program: TProgram;

  if (programRef.parent.parent?.parent?.parent) {
    program = {
      ...programMode,
      clinicianId: programRef.parent.parent.parent.parent.id,
      clinicianProgramId: programId,
      version: programRef.id,
    };
    return program;
  } else {
    return { ...programMode, euneoProgramId: programId as TEuneoProgramId };
  }
}

/**
 *
 * @param trainingDays
 * @param program
 * @param phaseId
 * @param date
 * @param length
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
    const infoDay = program.days[dayId];

    // Determine if it's a rest day by checking if the day of the week (adjusted to start on Monday) is a training day
    const isRestDay = !trainingDays[(d.getDay() + 6) % 7];

    // Push a new day object to the dayList array
    dayList.push({
      dayId: dayId,
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

export function createModifiedVersion(version: string) {
  // Split the string at the period
  const parts = version.split(".");
  // Convert the first part to a number
  const base = parseInt(parts[0]);
  if (parseInt(parts[1]) === 0) {
    const docRef = doc(collection(db, "newPrograms"));
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

export function getProgramNameForApp(programInfo: {
  name?: string;
  conditionId: TConditionId | null;
}) {
  // Only show the name of Euneo programs
  if (programInfo.conditionId && programInfo.name) return programInfo.name;
  else if (programInfo.conditionId) return conditions[programInfo.conditionId];
  else return "";
}

// Deprecated program functions
// TODO: Remove when all clients are stable
export async function _fetchDeprecatedProgramBase(
  programRef: DocumentReference<TProgramWrite>
) {
  const programSnap = await getDoc(
    programRef.withConverter(oldProgramConverter)
  );
  if (!programSnap.exists()) {
    throw new Error("Program does not exist.");
  }
  const programData = programSnap.data();
  return programData;
}

export async function _fetchDeprecatedProgramDays(
  programRef: DocumentReference
) {
  const daySnapshots = await getDocs(
    collection(programRef, "days").withConverter(oldProgramDayConverter)
  );

  return Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

export async function _fetchDeprecatedProgramPhases(
  programRef: DocumentReference
): Promise<{
  [k: string]: TProgramPhase;
}> {
  const phaseSnapshots = await getDocs(
    collection(programRef, "phases").withConverter(oldProgramPhaseConverter)
  );

  return Object.fromEntries(
    phaseSnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

export async function _getDeprecatedProgramFromRef(
  programRef: DocumentReference<TProgramWrite>
): Promise<TProgram> {
  const [programBase, phases, days] = await Promise.all([
    _fetchDeprecatedProgramBase(programRef),
    _fetchDeprecatedProgramPhases(programRef),
    _fetchDeprecatedProgramDays(programRef),
  ]);

  const programId = programRef.id;

  const programMode: TProgramWithSubCollections = {
    ...programBase,
    days,
    phases,
  };

  let program: TProgram;

  if (programRef.parent.parent) {
    program = {
      ...programMode,
      clinicianId: programRef.parent.parent.id,
      clinicianProgramId: programId,
      version: "1.0",
    };
    return program;
  } else {
    return { ...programMode, euneoProgramId: programId as TEuneoProgramId };
  }
}
