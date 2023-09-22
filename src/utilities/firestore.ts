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
  addDoc,
  CollectionReference,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/db";

import {
  programDayConverter,
  physioClientConverter,
  clientProgramConverter,
  clientProgramDayConverter,
  exerciseConverter,
  programConverter,
  programPhaseConverter,
  outcomeMeasureConverter,
} from "./converters";
import runtimeChecks from "./runtimeChecks";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramDayRead,
  TProgramRead,
  TProgram,
  TPhaseProgram,
  TContinuousProgram,
  TProgramWrite,
} from "../types/programTypes";
import {
  TClientProgram,
  TClientProgramWrite,
  TClientWrite,
} from "../types/clientTypes";
import {
  TInvitationWrite,
  TPhysioClient,
  TPhysioClientBase,
  TPhysioClientRead,
  TPhysioClientWrite,
} from "../types/physioTypes";
import {
  TEuneoProgramId,
  TExercise,
  TExerciseWrite,
  TOutcomeMeasure,
  TOutcomeMeasureWrite,
} from "../types/baseTypes";

async function _fetchProgramBase(programRef: DocumentReference<TProgramWrite>) {
  const programSnap = await getDoc(programRef.withConverter(programConverter));
  if (!programSnap.exists()) {
    throw new Error("Program does not exist.");
  }
  const programData = programSnap.data();
  return programData;
}

async function _fetchDays(programRef: DocumentReference) {
  const daySnapshots = await getDocs(
    collection(programRef, "days").withConverter(programDayConverter)
  );

  return Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

async function _fetchPhases(programRef: DocumentReference) {
  const phaseSnapshots = await getDocs(
    collection(programRef, "phases").withConverter(programPhaseConverter)
  );
  return Object.fromEntries(
    phaseSnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

async function _getProgramFromRef(
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

// TODO: Breyta testPrograms í programs þegar við erum búnir að uppfæra db
export async function getEuneoProgramWithDays(
  euneoProgramId: TEuneoProgramId
): Promise<TEuneoProgram> {
  let programRef = doc(
    db,
    "testPrograms",
    euneoProgramId
  ) as DocumentReference<TProgramWrite>;
  console.log("hi");

  const euneoProgram = await _getProgramFromRef(programRef);

  if (!("euneoProgramId" in euneoProgram)) {
    throw new Error("Program is not an euneo program");
  }

  return euneoProgram;
}

export async function getPhysioProgramWithDays(
  physioId: string,
  physioProgramId: string
): Promise<TPhysioProgram> {
  let programRef = doc(
    db,
    "physios",
    physioId,
    "programs",
    physioProgramId
  ) as DocumentReference<TProgramWrite>;

  const physioProgram = await _getProgramFromRef(programRef);

  if (!("physioId" in physioProgram)) {
    throw new Error("Program is not a physio program");
  }

  return physioProgram;
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

  const querySnapshot = (await getDocs(q)) as QuerySnapshot<TInvitationWrite>;

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

  console.log("programRef", programRef);

  const program = (await _getProgramFromRef(programRef)) as TPhysioProgram;

  runtimeChecks.assertTPhysioProgram(program);

  console.log("-----------program", program);

  return program;
}

export async function createPhysioClient(
  data: TPhysioClientRead,
  physioId: string
): Promise<TPhysioClient> {
  try {
    const physioRef = doc(db, "physios", physioId);
    const clientsRef = collection(physioRef, "clients");
    const clientRef = await addDoc(
      clientsRef.withConverter(physioClientConverter),
      data
    );
    return {
      ...data,
      physioClientId: clientRef.id,
    };
  } catch (error) {
    console.error("Error adding physio client:", error, {
      data,
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
        if (
          clientData.clientId &&
          clientData.prescription?.status === "Accepted"
        ) {
          const clientRef = doc(
            db,
            "clients",
            clientData.clientId
          ) as DocumentReference<TClientWrite>;
          const clientSnap = await getDoc(clientRef);
          const currentProgramId = clientSnap.data()!.currentProgramId || "";
          const clientProgramWithDays = await getClientProgram(
            clientData.clientId,
            currentProgramId
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
    ) as DocumentReference<TPhysioClientWrite>;

    const clientSnap = await getDoc(
      physioClientRef.withConverter(physioClientConverter)
    );

    const clientData = clientSnap.data();
    if (!clientData) throw new Error("Client not found");

    // get clients program data.
    let clientProgram: TClientProgram | undefined;
    // Get client program data if client has accepted a prescription
    if (clientData.clientId && clientData.prescription?.status === "Accepted") {
      const clientRef = doc(
        db,
        "clients",
        clientData.clientId
      ) as DocumentReference<TClientWrite>;
      const clientSnap = await getDoc(clientRef);
      const currentProgramId = clientSnap.data()!.currentProgramId || "";
      const clientProgramWithDays = await getClientProgram(
        clientData.clientId,
        currentProgramId
      );
      clientProgram = clientProgramWithDays;
    }

    return {
      ...clientData,
      physioClientId: clientSnap.id,
      ...(clientProgram && { clientProgram }),
    };
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
  try {
    const clientProgramRef = (
      doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgramId
      ) as DocumentReference<TClientProgramWrite>
    ).withConverter(clientProgramConverter);

    const clientProgramSnap = await getDoc(clientProgramRef);

    const clientProgram = clientProgramSnap.data();

    if (!clientProgram) {
      throw new Error("Client program not found");
    }

    console.log("clientProgram", clientProgram);
    // add days to clientProgram
    const daysSnap = await getDocs(
      query(
        collection(clientProgramRef, "days"),
        orderBy("date")
      ).withConverter(clientProgramDayConverter)
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
  } catch (error) {
    console.error("Error fetching client program:", error, {
      clientId,
      clientProgramId,
    });
  }
  return {} as TClientProgram;
}

export async function getAllExercises(): Promise<Record<string, TExercise>> {
  try {
    const exercisesRef = collection(
      db,
      "exercises"
    ) as CollectionReference<TExerciseWrite>;
    const exercisesSnap = await getDocs(
      exercisesRef.withConverter(exerciseConverter)
    );
    const exercisesList = exercisesSnap.docs.map((doc) => doc.data());

    // create a map of exercises
    const exercises = Object.fromEntries(
      exercisesList.map((exercise) => [exercise.id, exercise])
    );

    return exercises;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw error;
  }
}

export async function getAllOutcomeMeasures(): Promise<
  Record<string, TOutcomeMeasure>
> {
  try {
    const outcomeMeasuresRef = collection(
      db,
      "outcomeMeasures"
    ) as CollectionReference<TOutcomeMeasureWrite>;
    const outcomeMeasuresSnapshot = await getDocs(
      outcomeMeasuresRef.withConverter(outcomeMeasureConverter)
    );
    const outcomeMeasures = Object.fromEntries(
      outcomeMeasuresSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );

    return outcomeMeasures;
  } catch (error) {
    console.log("Error getting outcomeMeasures: ", error);
    throw error;
  }
}

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

export async function createPhysio(
  physioId: string,
  email: string,
  name: string
): Promise<boolean> {
  try {
    const physioRef = doc(db, "physios", physioId);
    await setDoc(physioRef, { email, name });
    return true;
  } catch (error) {
    console.error("Error creating physio:", error, {
      physioId,
      email,
      name,
    });
    return false;
  }
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
