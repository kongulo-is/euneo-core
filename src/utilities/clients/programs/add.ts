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
  TClientClinicianProgramRead,
  TClientClinicianProgram,
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
  TEuneoProgram,
  TClinicianProgram,
  TProgramFinitePhase,
  TProgramPhaseKey,
} from "../../../types/programTypes";
import {
  clientProgramConverter,
  clientProgramDayConverter,
} from "../../converters";
import { TOutcomeMeasureId } from "../../../types/clinicianTypes";
import { createPhase } from "../../programHelpers";

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

export async function addClinicianProgramToClient(
  clientId: string,
  clientClinicianProgram: TClientClinicianProgramRead,
  program: TClinicianProgram,
  startPhase: TProgramPhaseKey = "p1"
): Promise<TClientClinicianProgram> {
  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  const clientProgramRef = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    clientClinicianProgram
  );
  const { trainingDays } = clientClinicianProgram;
  const clientProgramDays = createPhase(
    trainingDays,
    program,
    startPhase,
    new Date(),
    14
  );

  await Promise.all(
    clientProgramDays.map((day, i) => {
      const dayCol = doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgramRef.id,
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

  updateDoc(clientRef, {
    currentProgramRef: doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramRef.id
    ),
  });

  const clientProgram: TClientClinicianProgram = {
    ...clientClinicianProgram,
    days: clientProgramDays,
    clientProgramId: clientProgramRef.id,
  };

  return clientProgram;
}

export async function addEuneoProgramToClient(
  clientId: string,
  clientProgramRead: TClientEuneoProgramRead,
  program: TEuneoProgram,
  phaseId: TProgramPhaseKey
): Promise<{ clientProgram: TClientEuneoProgram }> {
  const { trainingDays, phases } = clientProgramRead;

  // const currentPhase = program.phases[phaseId];
  const phaseLength = phases[phases.length - 1].value;
  const length = phaseLength;

  const clientProgramDays: TClientProgramDay[] = createPhase(
    trainingDays,
    program,
    phaseId,
    new Date(),
    length
  );

  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  const clientProgramRef = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    clientProgramRead
  );

  let d = new Date();
  d.setHours(0, 0, 0, 0);

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
