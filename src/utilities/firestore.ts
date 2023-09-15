import {
  DocumentReference,
  QuerySnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase/db";
import {
  EuneoProgramWrite,
  InvitationWrite,
  PhysioClientWrite,
  PrescriptionWrite,
  ClientProgramWrite,
  ClientWrite,
} from "../types/converterTypes";
import { TPhysioClient, TOutcomeMeasureId } from "../types/baseTypes";
import {
  physioProgramConverter,
  programDayConverter,
  physioClientConverter,
  clientProgramConverter,
  clientProgramDayConverter,
  exerciseConverter,
  continuousProgramConverter,
} from "./converters";
import runtimeChecks from "./runtimeChecks";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramDay,
  TContinuousProgram,
} from "../types/programTypes";
import {
  TClientPhysioProgram,
  TClientProgram,
  TClientProgramBase,
  TClientProgramDay,
} from "../types/clientTypes";
import { updateDoc } from "./updateDoc";

async function _getProgramFromRef(
  programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>
): Promise<TPhysioProgram | TEuneoProgram> {
  const [programSnap, daySnapshots] = await Promise.all([
    getDoc(programRef.withConverter(physioProgramConverter)),
    getDocs(collection(programRef, "days").withConverter(programDayConverter)),
  ]);

  // TODO: vantar error check ef programRef er ekki til
  const program = programSnap.data();
  // ! const program = programSnap.data()!; ef þú unkommentar þetta þá fer villan niðri
  // ! en þetta var commentað af því að programRef getur verið undefined

  const days = Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );

  // TODO: Add phases

  // TODO: check if program is undefined
  return { ...program!, days };
}

export async function getProgramWithDays(
  programPath: TProgramPath
): Promise<TPhysioProgram | TEuneoProgram> {
  let programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>;

  // Determine if it's a program or a physio program based on the path format
  const parts = programPath.split("/");
  if (parts.length === 2) {
    // It's a program ID
    programRef = doc(db, programPath) as DocumentReference<EuneoProgramWrite>;
  } else if (parts.length === 4) {
    // It's a physio program ID
    programRef = doc(db, programPath) as DocumentReference<PhysioProgramWrite>;
  } else {
    throw new Error("Invalid program path format");
  }

  return _getProgramFromRef(programRef);
}

export async function getPhysioProgramsWithDays(
  physioId: string
): Promise<TPhysioProgram[]> {
  try {
    const physioRef = doc(db, "physios", physioId);
    const programsRef = collection(physioRef, "programs");
    console.log("programsRef", programsRef);
    const programsSnap = await getDocs(
      programsRef.withConverter(continuousProgramConverter)
    );

    // for each program, get the days
    const daysSnap = await Promise.all(
      programsSnap.docs.map((doc) =>
        getDocs(collection(doc.ref, "days").withConverter(programDayConverter))
      )
    );
    // map the days to the programs
    const programs: TPhysioProgram[] = programsSnap.docs.map((doc, i) => {
      const days = Object.fromEntries(
        daysSnap[i].docs.map((doc) => [doc.id, doc.data()])
      );
      return { ...doc.data(), days, physioProgramId: doc.id, physioId };
    });

    return programs;
  } catch (error) {
    console.error("Error fetching physio programs:", error);
    throw error;
  }
}

export async function getProgramFromCode(
  code: string
): Promise<TPhysioProgram | TEuneoProgram> {
  // We dont need a converter here because it would not convert anything
  const q = query(collection(db, "invitations"), where("code", "==", code));

  const querySnapshot = (await getDocs(q)) as QuerySnapshot<InvitationWrite>;

  if (querySnapshot.empty) {
    console.log("No matching invitation found.");
    throw new Error("No matching invitation found.");
  }

  const firstDoc = querySnapshot.docs[0];
  const { physioClientRef } = firstDoc.data();

  const physioClientDoc = await getDoc(physioClientRef);
  const physioClientData = physioClientDoc.data();

  if (!physioClientData || !physioClientData.prescription) {
    // TDOD: handle error client side
    throw new Error("Prescription not found for the given PhysioClient");
  }

  const { programRef } = physioClientData.prescription;

  // TODO: delete the invitation from db

  const program = await _getProgramFromRef(programRef);

  return program;
}

export async function createPhysioClient(
  data: PhysioClientWrite,
  physioId: string
) {
  try {
    const physioRef = doc(db, "physios", physioId);
    const clientsRef = collection(physioRef, "clients");
    const clientRef = await addDoc(clientsRef, data);
    return clientRef.id;
  } catch (error) {
    console.error("Error adding physio client:", error, {
      data,
    });
    throw error;
  }
}

export async function addPrescriptionToPhysioClient(
  programPath: TProgramPath,
  physioId: string,
  physioClientId: string
) {
  try {
    let programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>;
    // Determine if it's a program or a physio program based on the path format
    const parts = programPath.split("/");
    if (parts.length === 2) {
      // It's a program ID
      programRef = doc(db, programPath) as DocumentReference<EuneoProgramWrite>;
    } else if (parts.length === 4) {
      // It's a physio program ID
      programRef = doc(
        db,
        programPath
      ) as DocumentReference<PhysioProgramWrite>;
    } else {
      throw new Error("Invalid program path format");
    }
    const clientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<PhysioClientWrite>;

    const prescription: PrescriptionWrite = {
      programRef,
      prescriptionDate: Timestamp.now(),
      status: "Invited",
    };

    await updateDoc(clientRef, {
      prescription,
    });
    return true;
  } catch (error) {
    console.error("Error adding prescription to physio client:", error, {
      programPath,
      physioId,
      physioClientId,
    });
    throw error;
  }
}

export async function getPhysioClients(
  physioId: string
): Promise<TPhysioClient[]> {
  try {
    // Get clients data form physio collection
    const physioRef = doc(db, "physios", physioId);
    const clientsRef = collection(physioRef, "clients");
    const snapshot = await getDocs(
      clientsRef.withConverter(physioClientConverter)
    );

    // get clients program data from programs subcollection to client.
    const clientsData = await Promise.all(
      snapshot.docs.map(async (c) => {
        const clientData = c.data();
        // if clientId, get program data (date, status, etc.) from prescribed program.
        // TODO: remove this. This is just for testing.
        return {
          ...clientData,
          program: undefined,
        } as TPhysioClient;
        // if (clientData.clientId && clientData.prescription?.programId) {
        //   let programRef: DocumentReference<ClientProgramWrite>;
        //   let clientRef: DocumentReference<ClientWrite>;
        //   clientRef = doc(
        //     db,
        //     "clients",
        //     clientData.clientId
        //   ) as DocumentReference<ClientWrite>;
        //   programRef = doc(
        //     clientRef,
        //     "programs",
        //     clientData.prescription.programId
        //   ) as DocumentReference<ClientProgramWrite>;

        //   const programSnap = await getDoc(
        //     programRef.withConverter(clientProgramConverter)
        //   );
        //   const programData = programSnap.data();

        //   const daySnapshots = await getDocs(
        //     collection(programRef, "days").withConverter(
        //       clientProgramDayConverter
        //     )
        //   );

        //   const days = daySnapshots.docs.map((doc) => doc.data());

        //   const physioClient: TPhysioClient = {
        //     ...clientData,
        //     program: {
        //       ...programData,
        //       days,
        //     },
        //   };

        //   return physioClient;
        // }
      })
    ).catch((err) => {
      console.error(err);
      return [];
    });

    return clientsData;
  } catch (error) {
    console.error("Error fetching clients:", error, {
      physioId,
    });
    return [];
  }
}

// get single physio client
export async function getPhysioClient(
  physioId: string,
  physioClientId: string
): Promise<TPhysioClient> {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<PhysioClientWrite>;

    const clientSnap = await getDoc(
      physioClientRef.withConverter(physioClientConverter)
    );
    const clientData = clientSnap.data();

    if (!clientData) {
      throw new Error("Client not found");
    }

    // TODO: get clients program data.

    return clientData;
  } catch (error) {
    console.error("Error fetching client:", error, {
      physioId,
      physioClientId,
    });
  }

  return {} as TPhysioClient;
}

export async function addPhysioProgramToClient(
  clientId: string,
  clientPhysioProgram: TClientPhysioProgram,
  days: { [key: string]: TProgramDay }
): Promise<{ clientProgram: TClientPhysioProgram }> {
  // const { physioId, conditionId, physioProgramId, days } = physioProgram;

  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  const program = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    clientPhysioProgram
  );

  let dayList: TClientProgramDay[] = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  const iterator = 14;

  console.log("here3");

  const { trainingDays } = clientPhysioProgram;

  for (let i = 0; i < iterator; i++) {
    const dayId = "d1";
    const isRestDay = !trainingDays[d.getDay()];
    const infoDay = days[dayId];

    dayList.push({
      dayId,
      date: new Date(d),
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0) || [],
      restDay: isRestDay,
    });

    d.setDate(d.getDate() + 1);
  }
  console.log("here4");

  const clientProgram: TClientProgram = {
    ...clientPhysioProgram,
    days: dayList,

    clientProgramId: program.id,
  };
  await Promise.all(
    dayList.map((day, i) => {
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

  console.log("here5");

  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<ClientWrite>;

  updateDoc(clientRef, { currentProgramId: program.id });

  return { clientProgram: clientProgram };
}

export async function addEuneoProgramToClient(
  clientId: string,
  programId: string,
  clientProgramOmitted: Omit<TClientProgramBase, "days">,
  days: { [key: string]: TProgramDay }
): Promise<{ clientProgram: TClientProgram }> {
  // const { physioId, conditionId, physioProgramId, days } = physioProgram;

  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  const program = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    clientProgramOmitted
  );

  let dayList: TClientProgramDay[] = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  const iterator = 14;

  console.log("here3");

  const { trainingDays } = clientProgramOmitted;

  for (let i = 0; i < iterator; i++) {
    const dayId = "d1";
    const isRestDay = !trainingDays[d.getDay()];
    const infoDay = days[dayId];

    dayList.push({
      dayId,
      date: new Date(d),
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0) || [],
      restDay: isRestDay,
    });

    d.setDate(d.getDate() + 1);
  }
  console.log("here4");

  const clientProgram: TClientProgram = {
    ...clientProgramOmitted,
    days: dayList,
    programId: program.id,
    clientProgramId: program.id,
  };
  await Promise.all(
    dayList.map((day, i) => {
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

  console.log("here5");

  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<ClientWrite>;

  updateDoc(clientRef, { currentProgramId: program.id });

  return { clientProgram: clientProgram };
}

export async function getClientProgram(
  clientId: string,
  clientProgramId: string
): Promise<TClientProgram> {
  const clientProgramRef = (
    doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId
    ) as DocumentReference<ClientProgramWrite>
  ).withConverter(clientProgramConverter);

  const clientProgramSnap = await getDoc(clientProgramRef);

  const clientProgram = clientProgramSnap.data();

  if (!clientProgram) {
    throw new Error("Client program not found");
  }

  // add days to clientProgram
  const daysSnap = await getDocs(
    collection(clientProgramRef, "days").withConverter(
      clientProgramDayConverter
    )
  );

  console.log("daySnap", daysSnap);

  const days = daysSnap.docs.map((doc) => doc.data());

  const clientProgramWithDays: TClientProgram = {
    ...clientProgram,
    clientProgramId: clientProgramSnap.id,
    days,
  };

  runtimeChecks.assertTClientProgram(clientProgramWithDays);

  return clientProgramWithDays;
}

export async function getAllExercises() {
  const exercisesRef = collection(db, "exercises");
  const exercisesSnap = await getDocs(
    exercisesRef.withConverter(exerciseConverter)
  );
  const exercisesList = exercisesSnap.docs.map((doc) => doc.data());

  // create a map of exercises
  const exercises = Object.fromEntries(
    exercisesList.map((exercise) => [exercise.id, exercise])
  );

  return exercises;
}

// type TProgramBase = {
//   name: string;
//   conditionId: TConditionId;
//   outcomeMeasureIds?: TOutcomeMeasureId[];
//   // TODO: ræða hvort days eigi að vera hér inni eða ekki.
//   days: { [key: string]: TProgramDay };
// };

// export type TContinuousProgram = TProgramBase & {
//   mode: "continuous";
// };
// TODO: tekur inn continuous program, skrifar í gagnagrunninn og skilar physioProgram (með program id og physio id)
export async function createPhysioProgram(
  continuousProgram: TContinuousProgram,
  physioId: string
  // continuousProgram: Omit<TPhysioProgram, "physioProgramId">
) {
  const physioRef = doc(db, "physios", physioId);
  const programsRef = collection(physioRef, "programs");

  const programRef = await addDoc(
    programsRef.withConverter(continuousProgramConverter),
    continuousProgram // * There is no error because
  );
  const daysRef = collection(programRef, "days");

  const dayRef = await addDoc(daysRef, continuousProgram.days);

  const physioProgram: TPhysioProgram = {
    ...continuousProgram,
    physioId,
    physioProgramId: programRef.id,
  };

  return physioProgram;
}

// export type ClientProgramWrite = {
//   programBy: "Euneo" | string; //? bæta þessu við? string: physioId
//   conditionId: TConditionId;
//   outcomeMeasuresAnswers: TOutcomeMeasureAnswer[];
//   painLevel: TPainLevel[];
//   days: TClientProgramDay[]; //TODO: ? Tékka við viljum við hafa þetta hér inni eða ekki.
//   conditionAssessmentAnswers?: Array<boolean | string>;
//   phases?: TPhase[];
//   trainingDays?: boolean[]; //TODO: ? Tékka hvort þetta sé einhverntíman ekki sett í gagnagrunninn.
//   physicalInformation?: TClientPhysicalInformation;
// };

// /**
//  *
//  * @param db
//  * @param programInfo is of type TPhysioProgram | TEuneoProgram
//  */
// export async function addProgramToUser(
//   db: Firestore,
//   programInfo: TPhysioProgram | TEuneoProgram
// ) {
//   const clientProgram: TClientProfile = {
//     program,
//   };
// }
