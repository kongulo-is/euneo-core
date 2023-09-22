import {
  collection,
  addDoc,
  doc,
  setDoc,
  DocumentReference,
  updateDoc,
  Timestamp,
  CollectionReference,
  deleteField,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/db";
import {
  TClientEuneoProgram,
  TClientEuneoProgramRead,
  TClientPhysioProgram,
  TClientPhysioProgramRead,
  TClientProgramDay,
  TClientWrite,
} from "../types/clientTypes";
import {
  TEuneoProgram,
  TPhaseProgram,
  TPhysioProgram,
  TProgramDay,
  TProgramWrite,
} from "../types/programTypes";
import {
  clientProgramConverter,
  clientProgramDayConverter,
  prescriptionConverter,
} from "./converters";
import {
  TPhysioClient,
  TPhysioClientWrite,
  TPrescription,
  TPrescriptionWrite,
} from "../types/physioTypes";

// Overloads
// export function addProgramToClient(
//   clientId: string,
//   clientProgram: TClientEuneoProgramRead,
//   days: { [key: string]: TProgramDay }
// ): Promise<TClientEuneoProgram>;
// export function addProgramToClient(
//   clientId: string,
//   clientProgram: TClientPhysioProgramRead,
//   days: { [key: string]: TProgramDay }
// ): Promise<TClientPhysioProgram>;
// // Implementation
// export async function addProgramToClient(
//   clientId: string,
//   clientProgram: TClientEuneoProgramRead | TClientPhysioProgramRead,
//   days: { [key: string]: TProgramDay }
// ): Promise<TClientProgram> {
//   if ("euneoProgramId" in clientProgram) {
//     return clientProgram;
//   } else {
//     const clientPhysioProgram = await addPhysioProgramToClient(
//       clientId,
//       clientProgram,
//       days
//     );
//     return clientPhysioProgram;
//   }
// }

// Usage
// const euneoProgramProps: {
//   clientId: string;
//   clientProgram: TClientEuneoProgram;
//   days: any;
// } = {
//   clientId: "client1",
//   clientProgram: {
//     conditionId: "plantar-heel-pain",
//     euneoProgramId: "euneo1",
//     outcomeMeasuresAnswers: [] as TOutcomeMeasureAnswers[],
//     painLevels: [] as TPainLevel[],
//     physicalInformation: {
//       athlete: false,
//       height: 0,
//       weight: 0,
//       unit: "metric",
//       physicalActivity: "None",
//     },
//     trainingDays: [] as boolean[],
//     conditionAssessmentAnswers: [] as Array<boolean | string>,
//   },
//   days: {},
// };

// const physioProgramProps: {
//   clientId: string;
//   clientProgram: TClientPhysioProgram;
//   days: any;
// } = {
//   clientId: "client2",
//   clientProgram: {
//     conditionId: "plantar-heel-pain",
//     physioProgramId: "physio1",
//     physioId: "physio2",
//     outcomeMeasuresAnswers: [],
//     painLevels: [],
//     physicalInformation: {
//       athlete: false,
//       height: 0,
//       weight: 0,
//       unit: "metric",
//       physicalActivity: "None",
//     },
//     trainingDays: [],
//     conditionAssessmentAnswers: [],
//   },
//   days: {},
// };

// const euneoResult = addProgramToClient(
//   euneoProgramProps.clientId,
//   euneoProgramProps.clientProgram,
//   euneoProgramProps.days
// );
// const physioResult = addProgramToClient(
//   physioProgramProps.clientId,
//   physioProgramProps.clientProgram,
//   physioProgramProps.days
// );

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

export async function addPrescriptionToPhysioClient(
  physioId: string,
  physioClientId: string,
  prescription: TPrescription
) {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    // check if user has a current prescription
    const physioClientSnapshot = await getDoc(physioClientRef);
    const currentPrescription = physioClientSnapshot.data()?.prescription;
    if (currentPrescription) {
      // store current prescription in past prescription sub collection
      const pastPrescriptionRef = collection(
        physioClientRef,
        "pastPrescriptions"
      ) as CollectionReference<TPrescriptionWrite>;
      await addDoc(pastPrescriptionRef, currentPrescription);
    }

    // change the physio client's prescription
    const prescriptionConverted =
      prescriptionConverter.toFirestore(prescription);

    await updateDoc(physioClientRef, {
      prescription: prescriptionConverted,
    });

    // Create invitation for client
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const invitationRef = collection(db, "invitations");
    await addDoc(invitationRef, {
      physioClientRef,
      code,
    });

    return true;
  } catch (error) {
    console.error(
      "Error adding prescription to physio client",
      error,
      prescription,
      physioId,
      physioClientId
    );

    throw error;
  }
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

  updateDoc(clientRef, { currentProgramId: program.id });

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
  program: TEuneoProgram & TPhaseProgram, // TODO: Er þetta ugly hack?
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

  updateDoc(clientRef, { currentProgramId: clientProgram.clientProgramId });

  return { clientProgram: clientProgram };
}
