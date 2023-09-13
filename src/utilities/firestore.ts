import {
  DocumentReference,
  QuerySnapshot,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  updateDoc,
  WithFieldValue,
} from "firebase/firestore";
import { db } from "../firebase/db";
import {
  EuneoProgramWrite,
  PhysioProgramWrite,
  InvitationWrite,
  PhysioClientWrite,
  PrescriptionWrite,
  ClientProgramWrite,
  ClientWrite,
} from "../types/converterTypes";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramPath,
  TPhysioClient,
  TPainLevel,
  TOutcomeMeasureAnswers,
  TClientProgram,
  TClientProgramDay,
  TClientPhysicalInformation,
} from "../types/datatypes";
import {
  physioProgramConverter,
  programDayConverter,
  physioClientConverter,
  clientProgramConverter,
  clientProgramDayConverter,
} from "./converters";
import runtimeChecks from "./runtimeChecks";

async function _getProgramFromRef(
  programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>
): Promise<TPhysioProgram | TEuneoProgram> {
  const [programSnap, daySnapshots] = await Promise.all([
    getDoc(programRef.withConverter(physioProgramConverter)),
    getDocs(collection(programRef, "days").withConverter(programDayConverter)),
  ]);

  const program = programSnap.data();
  const days = Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );

  // TODO: Add phases

  return { ...program, days };
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
    const programsRef = collection(physioRef, "programs").withConverter(
      physioProgramConverter
    );
    console.log("programsRef", programsRef);
    const programsSnap = await getDocs(programsRef);

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
      return { ...doc.data(), days };
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
          program: null,
        };
        if (clientData.clientId && clientData.prescription?.programId) {
          let programRef: DocumentReference<ClientProgramWrite>;
          let clientRef: DocumentReference<ClientWrite>;
          clientRef = doc(
            db,
            "clients",
            clientData.clientId
          ) as DocumentReference<ClientWrite>;
          programRef = doc(
            clientRef,
            "programs",
            clientData.prescription.programId
          ) as DocumentReference<ClientProgramWrite>;

          const programSnap = await getDoc(
            programRef.withConverter(clientProgramConverter)
          );
          const programData = programSnap.data();

          const daySnapshots = await getDocs(
            collection(programRef, "days").withConverter(
              clientProgramDayConverter
            )
          );

          const days = daySnapshots.docs.map((doc) => doc.data());

          const physioClient: TPhysioClient = {
            ...clientData,
            program: {
              ...programData,
              days,
            },
          };

          return physioClient;
        }
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

export async function addPhysioProgramToUser(
  clientId: string,
  physioProgram: TPhysioProgram,
  trainingDays: boolean[],
  painLevel: TPainLevel,
  outcomeMeasureAnswers: TOutcomeMeasureAnswers,
  physicalInformation: TClientPhysicalInformation
): Promise<{ clientProgram: TClientProgram; clientProgramId: string }> {
  const { physioId, conditionId, physioProgramId, days } = physioProgram;

  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  // Create clientProgram without clientProgramId
  const clientProgram: TClientProgram = {
    physioProgramId,
    physioId,
    conditionId,
    trainingDays,
    painLevels: [painLevel],
    outcomeMeasuresAnswers: [outcomeMeasureAnswers],
    physicalInformation,
    days: [], // a placeholder, it's not used
    clientProgramId: "", // a placeholder, it's not used
  };

  // Perform runtime checks
  runtimeChecks.assertTClientProgram(clientProgram, true); // Assertion done here if needed

  const program = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    clientProgram
  );

  clientProgram.clientProgramId = program.id;

  let dayList: TClientProgramDay[] = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  const iterator = 14;

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

  clientProgram.days = dayList;
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

  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<ClientWrite>;
  updateDoc(clientRef, { currentProgramId: program.id });

  return { clientProgram, clientProgramId: program.id };
}

export async function getClientProgram(
  clientId: string,
  clientProgramId: string
): Promise<TClientProgram> {
  const clientProgramRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<ClientProgramWrite>;

  const clientProgramSnap = await getDoc(
    clientProgramRef.withConverter(clientProgramConverter)
  );

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

  const days = daysSnap.docs.map((doc) => doc.data());

  const clientProgramWithDays: TClientProgram = {
    ...clientProgram,
    days,
  };

  runtimeChecks.assertTClientProgram(clientProgramWithDays);

  return clientProgramWithDays;
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
