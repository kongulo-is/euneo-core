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
  TPhaseProgram,
  TContinuousProgram,
  TEuneoProgram,
  TPhysioProgram,
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

export async function _fetchPhases(programRef: DocumentReference) {
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
  const [programBase, days] = await Promise.all([
    _fetchProgramBase(programRef),
    _fetchDays(programRef),
  ]);

  const programId = programRef.id;

  let programMode: TPhaseProgram | TContinuousProgram;

  if (programBase.mode === "phase") {
    const phases = await _fetchPhases(programRef);
    programMode = { ...programBase, days, phases, mode: "phase" };
  } else {
    programMode = { ...programBase, days, mode: "continuous" };
  }

  let program: TProgram;

  if (programRef.parent.parent) {
    program = {
      ...programMode,
      mode: "continuous",
      physioId: programRef.parent.parent.id,
      physioProgramId: programId,
    };
    return program;
  } else {
    return { ...programMode, euneoProgramId: programId as TEuneoProgramId };
  }
}

export function createPhase(
  trainingDays: boolean[],
  program: TEuneoProgram & TPhaseProgram,
  phaseId: `p${number}`,
  date?: Date,
  length?: number,
  startDayIndex?: number
): TClientProgramDay[] {
  const phase = program.phases[phaseId];
  let dayList = [] as Array<TClientProgramDay>;

  let restIndex = startDayIndex || 0;

  let d = date ? date : new Date();

  const iterator = length ? length : phase.length;

  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < iterator; i++) {
    const dayId = phase.days[restIndex % phase.days.length];
    const infoDay = program.days[dayId];

    const isRestDay = !trainingDays[d.getDay()];

    dayList.push({
      dayId: dayId,
      date: new Date(d),
      phaseId: phaseId,
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0),
      restDay: isRestDay,
    });

    d.setDate(d.getDate() + 1);
    !isRestDay && restIndex++;
  }

  return dayList;
}

export function createContinuousDays(
  trainingDays: Array<boolean>,
  program: TEuneoProgram | TPhysioProgram,
  date: Date,
  length?: number,
  startDayIndex?: number
) {
  const dayIdList = Object.keys(program.days) as Array<`d${number}`>;
  let dayList = [] as Array<TClientProgramDay>;

  let dayIndex = startDayIndex || 0;

  let d = date ? date : new Date();

  // TODO: Should 14 be dynamic number insted? (no. days that are created each time)
  const iterator = length ? length : 14;

  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < iterator; i++) {
    console.log(`Date ${i + 1}: `, d.toDateString());

    const dayId = dayIdList[dayIndex % dayIdList.length];
    const infoDay = program.days[dayId];

    const isRestDay = !trainingDays[d.getDay()];

    dayList.push({
      dayId: dayId,
      date: new Date(d),
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0),
      restDay: isRestDay,
    });

    d.setDate(d.getDate() + 1);
    !isRestDay && dayIndex++;
  }

  return dayList;
}
