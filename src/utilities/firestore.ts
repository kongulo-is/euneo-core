import {
  physioProgramConverter,
  dayConverter,
  physioClientConverter,
  clientProgramDayConverter,
  clientProgramConverter,
} from "./converters";

import {
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
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
  ClientProgramDayWrite,
  ClientProgramWrite,
  ClientWrite,
} from "@src/types/converterTypes";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramPath,
  TPhysioClient,
  TClientProgram,
  TClientProgramDay,
} from "@src/types/datatypes";
import { db } from "../firebase/initialize";

async function _getProgramFromRef(
  programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>
): Promise<TPhysioProgram | TEuneoProgram> {
  const [programSnap, daySnapshots] = await Promise.all([
    getDoc(programRef.withConverter(physioProgramConverter(db))),
    getDocs(collection(programRef, "days").withConverter(dayConverter(db))),
  ]);

  const program = programSnap.data();
  const days = Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );

  // TODO: Add phases

  return { ...program, days };
}

/**
 *
 * @param programRef
 * @param db
 * @returns
 */
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
      physioProgramConverter(db)
    );
    console.log("programsRef", programsRef);
    const programsSnap = await getDocs(programsRef);

    // for each program, get the days
    const daysSnap = await Promise.all(
      programsSnap.docs.map((doc) =>
        getDocs(collection(doc.ref, "days").withConverter(dayConverter(db)))
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
  console.log("EUNEO-TYPES-DEBUGGER1", db);

  // We dont need a converter here because it would not convert anything
  const q = query(collection(db, "invitations"), where("code", "==", code));
  console.log("EUNEO-TYPES-DEBUGGER", q);

  const querySnapshot = (await getDocs(q)) as QuerySnapshot<InvitationWrite>;

  if (querySnapshot.empty) {
    console.log("No matching invitation found.");
    throw new Error("No matching invitation found.");
  }

  const firstDoc = querySnapshot.docs[0];
  const { physioClientRef } = firstDoc.data();

  console.log("physioRef", physioClientRef, physioClientRef.id);

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

// TODO: 11.sept, testa þetta! - var hér.
export async function getPhysioClients(
  physioId: string
): Promise<TPhysioClient[]> {
  try {
    // Get clients data form physio collection
    const physioRef = doc(db, "physios", physioId);
    const clientsRef = collection(physioRef, "clients").withConverter(
      physioClientConverter(db)
    );
    const snapshot = await getDocs(clientsRef);

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
            programRef.withConverter(clientProgramConverter(db))
          );
          const programData = programSnap.data();

          const daySnapshots = await getDocs(
            collection(programRef, "days").withConverter(
              clientProgramDayConverter(db)
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
