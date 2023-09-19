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
  InvitationWrite,
  PhysioClientWrite,
  PrescriptionWrite,
  ClientProgramWrite,
  ClientWrite,
  ContinuousProgramWrite,
  PhaseProgramWrite,
} from "../types/converterTypes";
import {
  programDayConverter,
  physioClientConverter,
  clientProgramConverter,
  clientProgramDayConverter,
  exerciseConverter,
  programConverter,
  programPhaseConverter,
} from "./converters";
import runtimeChecks from "./runtimeChecks";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramDayRead,
  TProgramRead,
  TProgram,
  TPhaseProgram,
} from "../types/programTypes";
import { TClientProgram } from "../types/clientTypes";
import { updateDoc } from "./updateDoc";
import { TPhysioClient, TPhysioClientBase } from "../types/physioTypes";

async function _getProgramFromRef(
  programRef: DocumentReference<ContinuousProgramWrite | PhaseProgramWrite>
): Promise<TProgram> {
  const [programSnap, daySnapshots, phaseSnapshots] = await Promise.all([
    getDoc(programRef.withConverter(programConverter)),
    getDocs(collection(programRef, "days").withConverter(programDayConverter)),
    getDocs(
      collection(programRef, "phases").withConverter(programPhaseConverter)
    ),
  ]);

  // TODO: vantar error check ef programRef er ekki til
  const programBase = programSnap.data()!;

  const days = Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );

  let programMode: TPhaseProgram | TContinuousProgram;

  if (programBase.mode === "phase" && !phaseSnapshots.empty) {
    programBase;
    const phases = Object.fromEntries(
      phaseSnapshots.docs.map((doc) => [doc.id, doc.data()])
    );
    programMode = { ...programBase, days, phases, mode: "phase" };
  } else {
    programMode = { ...programBase, days, mode: "continuous" };
  }

  let program: TProgram;

  if (programRef.parent.parent) {
    program = {
      ...programMode,
      physioId: programRef.parent.parent.id,
      physioProgramId: programSnap.id,
      mode: "continuous",
    };
  } else {
    program = { ...programMode!, euneoProgramId: programSnap.id };
  }

  return program;
}

export async function getEuneoProgramWithDays(
  euneoProgramId: string
): Promise<TPhysioProgram | TEuneoProgram> {
  let programRef = doc(db, "testPrograms", euneoProgramId) as DocumentReference<
    ContinuousProgramWrite | PhaseProgramWrite
  >;

  return _getProgramFromRef(programRef);
}

export async function getPhysioProgramsWithDays(
  physioId: string
): Promise<TPhysioProgram[]> {
  try {
    const physioRef = doc(db, "physios", physioId);
    const programsRef = collection(physioRef, "programs");
    const programsSnap = await getDocs(
      programsRef.withConverter(programConverter)
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
      return {
        ...doc.data(),
        days,
        physioProgramId: doc.id,
        physioId,
        mode: "continuous",
      };
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
    const clientsData: TPhysioClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        const clientData: TPhysioClientBase = c.data();
        let clientProgram: TClientProgram | undefined;
        // Get client program data if client has accepted a prescription
        if (clientData.clientId && clientData.prescription?.programId) {
          const clientProgramWithDays = await getClientProgram(
            clientData.clientId,
            clientData.prescription.programId
          );
          clientProgram = clientProgramWithDays;
        }
        return {
          ...clientData,
          physioClientId: c.id,
          ...(clientProgram && { clientProgram }),
        };
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

// TODO: tekur inn continuous program, skrifar í gagnagrunninn og skilar physioProgram (með program id og physio id)
export async function createPhysioProgram(
  continuousProgram: TProgramRead,
  days: Record<`d${number}`, TProgramDayRead>,
  physioId: string
): Promise<TPhysioProgram> {
  try {
    const physioRef = doc(db, "physios", physioId);
    const programsRef = collection(physioRef, "programs");
    const programRef = await addDoc(
      programsRef.withConverter(programConverter),
      continuousProgram // * There is no error because
    );

    const daysRef = collection(programRef, "days");

    await setDoc(
      doc(daysRef.withConverter(programDayConverter), "d1"),
      days["d1"],
      { merge: true }
    );

    const physioProgram: TPhysioProgram = {
      ...continuousProgram,
      days,
      mode: "continuous",
      physioProgramId: programRef.id,
      physioId,
    };

    return physioProgram;
  } catch (error) {
    console.error("Error creating physio program:", error, {
      continuousProgram,
      days,
      physioId,
    });
  }
  throw new Error("Error creating physio program");
}

// // client ref
// const clientRef = doc(
//   db,
//   "clients",
//   clientData.clientId
// ) as DocumentReference<ClientWrite>;

// // client program
// const programRef = doc(
//   clientRef,
//   "programs",
//   clientData.prescription.programId
// ) as DocumentReference<ClientProgramWrite>;

// // client program days
// const programDaysRef = collection(
//   programRef,
//   "days"
// ) as CollectionReference<ClientProgramDayWrite>;

// const programSnap = await getDoc(
//   programRef.withConverter(clientProgramConverter)
// );

// const programBase: TClientProgramBase = programSnap.data();

// const programDays = await getDocs(
//   programDaysRef.withConverter(clientProgramDayConverter)
// );

// const days: TClientProgramDay[] = programDays.docs.map((doc) =>
//   doc.data()
// );

// const clientProgramData: TClientProgram = {
//   ...programSnap.data(),
//   clientProgramId: programSnap.id,
//   days,
// }
