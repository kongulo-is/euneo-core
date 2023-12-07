import {
  DocumentReference,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { TEuneoProgramId } from "../types/baseTypes";
import {
  TProgramWrite,
  TProgram,
  TEuneoProgram,
  TClinicianProgram,
  TProgramWithSubCollections,
  TProgramPhase,
} from "../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "./converters";
import { TClientProgramDay } from "../types/clientTypes";

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

export async function _fetchPhases(programRef: DocumentReference): Promise<{
  [k: string]: TProgramPhase;
}> {
  const phaseSnapshots = await getDocs(
    collection(programRef, "phases").withConverter(programPhaseConverter)
  );

  return Object.fromEntries(
    phaseSnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

export async function _getProgramFromRef(
  programRef: DocumentReference<TProgramWrite>
): Promise<TProgram> {
  const [programBase, phases, days] = await Promise.all([
    _fetchProgramBase(programRef),
    _fetchPhases(programRef),
    _fetchDays(programRef),
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
    };
    return program;
  } else {
    return { ...programMode, euneoProgramId: programId as TEuneoProgramId };
  }
}

export function createPhase(
  trainingDays: boolean[],
  program: TProgram,
  phaseId: `p${number}`,
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

// export function createContinuousDays(
//   trainingDays: Array<boolean>,
//   program: TProgram,
//   phaseId: `p${number}`,
//   date?: Date,
//   length?: number,
//   startDayIndex?: number
// ) {
//   const dayIdList = Object.keys(program.days) as Array<`d${number}`>;
//   let dayList = [] as Array<TClientProgramDay>;

//   let dayIndex = startDayIndex || 0;

//   let d = date ? date : new Date();

//   const iterator = length ? length : 14;

//   d.setHours(0, 0, 0, 0);
//   for (let i = 0; i < iterator; i++) {
//     const dayId = dayIdList[dayIndex % dayIdList.length];
//     const infoDay = program.days[dayId];

//     const isRestDay = !trainingDays[(d.getDay() + 6) % 7];

//     dayList.push({
//       dayId: dayId,
//       phaseId: phaseId,
//       date: new Date(d),
//       finished: false,
//       adherence: 0,
//       exercises: infoDay?.exercises.map(() => 0),
//       restDay: isRestDay,
//     });

//     d.setDate(d.getDate() + 1);
//     !isRestDay && dayIndex++;
//   }

//   return dayList;
// }
