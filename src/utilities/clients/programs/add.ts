import {
  collection,
  addDoc,
  doc,
  setDoc,
  DocumentReference,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClientPhysioProgramRead,
  TClientPhysioProgram,
  TClientWrite,
  TClientEuneoProgramRead,
  TClientEuneoProgram,
  TClientProgramDay,
  TOutcomeMeasureAnswers,
  TClientProgramWrite,
  TPainLevel,
  TPhase,
} from "../../../types/clientTypes";
import {
  TProgramDay,
  TEuneoProgram,
  TPhaseProgram,
} from "../../../types/programTypes";
import {
  clientProgramConverter,
  clientProgramDayConverter,
} from "../../converters";
import { TOutcomeMeasureId } from "../../../types/physioTypes";

function _createDays(
  programDays: Record<`d${number}`, TProgramDay>,
  trainingDays: boolean[],
  amountOfDays: number
) {
  let clientProgramDays: TClientProgramDay[] = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);

  // Get an array of day keys from programDays
  const dayKeys = Object.keys(programDays);
  console.log("Keys: " + dayKeys);

  if (dayKeys.length === 0) {
    // Handle the case where programDays is empty
    return clientProgramDays;
  }

  let currentDayIndex = 0; // Initialize to 0

  for (let i = 0; i < amountOfDays; i++) {
    // Get the current program day based on the currentDayIndex
    const currentProgramDayKey = dayKeys[currentDayIndex] as `d${number}`;
    const isRestDay = !trainingDays[d.getDay()];
    const infoDay = programDays[currentProgramDayKey];

    clientProgramDays.push({
      dayId: currentProgramDayKey,
      date: new Date(d),
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0) || [],
      restDay: isRestDay,
    });

    if (!isRestDay) {
      // Increment currentDayIndex and use modulo to cycle through days
      currentDayIndex = (currentDayIndex + 1) % dayKeys.length;
    }

    d.setDate(d.getDate() + 1);
  }

  return clientProgramDays;
}

async function _addDaysToFirestore(
  clientId: string,
  clientProgramId: string,
  days: TClientProgramDay[],
  firstDocIndex: number
) {
  const programRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;
  // Update days documents
  await Promise.all(
    days.map((day, i) => {
      const dayNumber = i + firstDocIndex;
      const dayCol = doc(programRef, "days", dayNumber.toString());
      return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
    })
  );
}

export async function addPhysioProgramToClient(
  clientId: string,
  clientPhysioProgram: TClientPhysioProgramRead,
  programDays: Record<`d${number}`, TProgramDay>
): Promise<TClientPhysioProgram> {
  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  const program = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    clientPhysioProgram
  );
  const { trainingDays } = clientPhysioProgram;
  const clientProgramDays = _createDays(programDays, trainingDays, 14);

  await Promise.all(
    clientProgramDays.map((day, i) => {
      const dayCol = doc(
        db,
        "clients",
        clientId,
        "programs",
        program.id,
        "days",
        i.toString()
      );
      return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
    })
  );

  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<TClientWrite>;

  updateDoc(clientRef, { currentProgramRef: program });

  const clientProgram: TClientPhysioProgram = {
    ...clientPhysioProgram,
    days: clientProgramDays,
    clientProgramId: program.id,
  };

  return clientProgram;
}

export async function addEuneoProgramToClient(
  clientId: string,
  clientProgramRead: TClientEuneoProgramRead,
  program: TEuneoProgram,
  phaseId: `p${number}`
): Promise<{ clientProgram: TClientEuneoProgram }> {
  // const { physioId, conditionId, physioProgramId, days } = physioProgram;
  const currentPhase = program.phases[phaseId];
  const phaseDays = currentPhase.days;
  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  const clientProgramRef = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    clientProgramRead
  );

  let clientProgramDays: TClientProgramDay[] = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  const iterator = currentPhase.length;

  console.log("here3");

  const { trainingDays } = clientProgramRead;

  let currentDayIndex = 0; // Initialize to 0

  for (let i = 0; i < iterator; i++) {
    // Get the current program day based on the currentDayIndex
    const currentProgramDayKey = phaseDays[currentDayIndex] as `d${number}`;
    const isRestDay = !trainingDays[d.getDay()];
    const infoDay = program.days[currentProgramDayKey];

    clientProgramDays.push({
      dayId: currentProgramDayKey,
      phaseId: phaseId,
      date: new Date(d),
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0) || [],
      restDay: isRestDay,
    });

    if (!isRestDay) {
      // Increment currentDayIndex and use modulo to cycle through days
      currentDayIndex = (currentDayIndex + 1) % phaseDays.length;
    }

    d.setDate(d.getDate() + 1);
  }
  console.log("here4");

  const clientProgram: TClientEuneoProgram = {
    ...clientProgramRead,
    days: clientProgramDays,
    euneoProgramId: clientProgramRead.euneoProgramId,
    clientProgramId: clientProgramRef.id,
  };
  await Promise.all(
    clientProgramDays.map((day, i) => {
      const dayCol = doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgram.clientProgramId,
        "days",
        i.toString()
      );
      return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
    })
  );

  console.log("here5");

  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<TClientWrite>;

  updateDoc(clientRef, { currentProgramRef: clientProgramRef });

  return { clientProgram: clientProgram };
}

// The context mapper should get data from the asyncs storage and set it to the context
export async function addOutcomeMeasureToClientProgram(
  clientId: string,
  clientProgramId: string,
  outcomeMeasuresAnswers: Record<TOutcomeMeasureId, TOutcomeMeasureAnswers[]>,
  newData: Record<Partial<TOutcomeMeasureId>, TOutcomeMeasureAnswers>
) {
  try {
    const programRef = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId
    ) as DocumentReference<TClientProgramWrite>;

    const newOutcomeMeasuresAnswers = { ...outcomeMeasuresAnswers };
    Object.entries(newData).forEach(([key, answers]) => {
      const measureId = key as TOutcomeMeasureId;
      const oldMeasureAnswers = outcomeMeasuresAnswers[measureId];
      if (oldMeasureAnswers) {
        newOutcomeMeasuresAnswers[measureId] = [...oldMeasureAnswers, answers];
      } else {
        newOutcomeMeasuresAnswers[measureId] = [answers];
      }
    });

    // Update the user's painLevel array in firestore
    await updateDoc(programRef, {
      outcomeMeasuresAnswers: newOutcomeMeasuresAnswers,
    });

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
}

export async function addPainLevelToClientProgram(
  clientId: string,
  clientProgramId: string,
  oldPainLevels: TPainLevel[],
  newPainLevel: TPainLevel
) {
  try {
    const programRef = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId
    ) as DocumentReference<TClientProgramWrite>;

    const newPainLevels = [...oldPainLevels, newPainLevel];

    // Update the user's painLevel array in firestore
    await Promise.all([
      updateDoc(programRef, {
        painLevels: newPainLevels,
      }),
    ]);

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
}

export async function addPhaseToClientProgram(
  clientId: string,
  clientProgramId: string,
  newPhase: TClientProgramDay[],
  programPhases: TPhase[],
  firstDocIndex: number
) {
  await _addDaysToFirestore(clientId, clientProgramId, newPhase, firstDocIndex);

  const programRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;

  await updateDoc(programRef, {
    phases: programPhases,
  });

  console.log("AddNewPhase func finished!!!");
}

export async function addContinuousDaysToClientProgram(
  clientId: string,
  clientProgramId: string,
  newDays: TClientProgramDay[],
  firstDocIndex: number
) {
  await _addDaysToFirestore(clientId, clientProgramId, newDays, firstDocIndex);
}

export async function updateTrainingDays(
  clientId: string,
  clientProgramId: string,
  newDays: TClientProgramDay[],
  trainingDays: boolean[],
  firstDocIndex: number
) {
  const programRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;
  // Update training days
  await updateDoc(programRef, {
    trainingDays: trainingDays,
  });

  await _addDaysToFirestore(clientId, clientProgramId, newDays, firstDocIndex);
}
