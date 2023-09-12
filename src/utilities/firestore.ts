import {
  physioProgramConverter,
  dayConverter,
  physioClientConverter,
  clientProgramDayConverter,
  clientProgramConverter,
} from "./converters";

import {
  DocumentReference,
  QuerySnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  EuneoProgramWrite,
  PhysioProgramWrite,
  InvitationWrite,
  ClientProgramWrite,
  ClientWrite,
  PhysioClientWrite,
  PrescriptionWrite,
} from "@src/types/converterTypes";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramPath,
  TPhysioClient,
  TClientProgram,
} from "@src/types/datatypes";
import { db } from "../firebase/db";

async function _getProgramFromRef(
  programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>
): Promise<TPhysioProgram | TEuneoProgram> {
  const [programSnap, daySnapshots] = await Promise.all([
    getDoc(programRef.withConverter(physioProgramConverter)),
    getDocs(collection(programRef, "days").withConverter(dayConverter)),
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
        getDocs(collection(doc.ref, "days").withConverter(dayConverter))
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
  prescription: PrescriptionWrite,
  physioId: string
) {
  try {
    const physioRef = doc(db, "physios", physioId);
    const clientsRef = collection(physioRef, "clients");
  } catch (error) {
    console.error("Error adding prescription to physio client:", error, {
      prescription,
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
  trainingDays: boolean[]
): Promise<TClientProgram> {
  // Store the program in the Firestore database
  const userProgramDoc = collection(db, "clients", clientId, "programs");

  console.log("userProgramDoc", userProgramDoc);

  // add program to client
  // TODO: take a look
  const program = await addDoc(
    userProgramDoc.withConverter(clientProgramConverter),
    {
      programId: physioProgram.physioProgramId,
      physioId: physioProgram.physioId,
      conditionId: physioProgram.conditionId,
      programBy: physioProgram.programBy,
      outcomeMeasuresAnswers: physioProgram.outcomeMeasuresAnswers,
      painLevels: physioProgram.painLevels,
    }
  );

  let dayList = [];

  let restIndex = 0;

  let d = new Date();

  const iterator = 14;

  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < iterator; i++) {
    const dayId = "d1";
    const day = physioProgram.days[dayId];

    console.log("day", day);

    const infoDay = physioProgram.days[dayId];
    const timestamp = Timestamp.fromDate(d);

    const isRestDay = !trainingDays[d.getDay()];

    dayList.push({
      id: dayId,
      date: timestamp,
      finished: false,
      adherence: 0,
      exercises: infoDay?.exercises.map(() => 0),
      restDay: isRestDay,
    });

    d.setDate(d.getDate() + 1);
    !isRestDay && restIndex++;
  }

  console.log("INITALPHASE", initialPhase);

  // Update the user's programs days array in firestore
  await Promise.all(
    initialPhase.map(async (day, i) => {
      const dayCol = doc(
        db,
        "clients",
        uid,
        "programs",
        program.id,
        "days",
        i.toString()
      );
      // TODO: find a way to do this earlier or write to Firestore by using converter
      day.exercises = day.exercises.reduce((acc, cur, i) => {
        // Convert the exercises to a map
        acc[i] = cur;
        return acc;
      }, {});
      await setDoc(dayCol, day);
    })
  );

  const clientRef = doc(db, "clients", uid);
  updateDoc(clientRef, { currentProgramId: program.id });

  // Return true if all operations succeed
  return program.id;
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
