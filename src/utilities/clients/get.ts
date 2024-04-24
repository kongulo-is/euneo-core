import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClient, TClientProgram, TClientRead } from "../../types/clientTypes";
import { clientConverter } from "../converters";
import { Unsubscribe } from "firebase/auth";
import { createClientDocument } from "./add";
import { getClientProgram } from "./programs/get";

export async function checkIfClientExists(clientId: string): Promise<boolean> {
  try {
    const clientRef = doc(db, "clients", clientId);
    const userRef = doc(db, "users", clientId);

    const clientDoc = await getDoc(clientRef);
    const userDoc = await getDoc(userRef);

    return clientDoc.exists() || userDoc.exists();
  } catch (error) {
    console.error("Error checking if client exists: ", error, { clientId });
    throw error;
  }
}

export async function getAllClients(): Promise<
  (TClient & { clientProgram?: TClientProgram })[]
> {
  const clientsRef = collection(
    db,
    "clients"
  ) as CollectionReference<TClientRead>;

  const clientsSnap = await getDocs(clientsRef.withConverter(clientConverter));

  const clientData = await Promise.all(
    clientsSnap.docs.map(async (client) => {
      let clientProgram: TClientProgram | null = null;

      const currentProgramId = client.data().currentProgramId;
      if (currentProgramId) {
        clientProgram = await getClientProgram(client.id, currentProgramId);
      }

      return {
        ...client.data(),
        clientId: client.id,
        ...(clientProgram && { clientProgram }),
      };
    })
  );

  if (!clientData) {
    // throw new Error("No client found");
    // signOut(auth);
    return [];
  }

  return clientData;
}

export async function getClient(clientId: string): Promise<TClient> {
  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<TClientRead>;

  const clientDoc = await getDoc(clientRef.withConverter(clientConverter));

  const clientData = clientDoc.data();

  if (!clientData) {
    // throw new Error("No client found");
    // signOut(auth);
    await convertUser(clientId);
    return getClient(clientId);
  }

  const client = {
    ...clientData,
    clientId: clientId,
  };

  return client;
}

export async function convertUser(userId: string): Promise<boolean> {
  return await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);

    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      // signOut(auth);
      createClientDocument(userId, "", "unknown");
      return false;
    }

    // create the client
    const clientRef = doc(db, "clients", userId);

    const clientData = {
      birthDate: userDoc.data()?.general.birthDate,
      name: userDoc.data()?.name,
      platform: userDoc.data()?.platform,
      gender: userDoc.data()?.general.gender,
      preferences: {
        reminders: {
          exercise: {
            enabled: true,
            hour: 18,
            minutes: 0,
          },
        },
        showCompletedExercises: false,
      },
    };
    transaction.set(clientRef, clientData);

    // Convert the program if user has program
    const program = userDoc.data()?.programs?.["plantar-heel-pain"];
    if (program && program.days.length > 0) {
      const { days } = program;
      const programData = {
        conditionAssessmentAnswers: program.general,
        conditionId: "plantar-heel-pain",
        outcomeMeasuresAnswers: {
          faam: program.assessments.map((assessment: any) => {
            return {
              date: assessment.date,
              outcomeMeasureId: "faam",
              sections: assessment.sections.map(
                (section: any, index: number) => {
                  return {
                    ...section,
                    sectionName: index === 0 ? "Activites" : "Sports",
                  };
                }
              ),
            };
          }),
        },
        painLevels: program.painLevel,
        phases: program.phases.map((phase: any) => {
          const phaseId = Object.keys(phase)[0];
          const length = phase[phaseId];
          return { key: phaseId, value: length };
        }),
        physicalInformation: program.userInfo,
        programRef: doc(db, "testPrograms", "plantar-heel-pain"),
        trainingDays: program.trainingDays,
      };
      const programRef = doc(collection(clientRef, "programs"));
      transaction.set(programRef, programData);

      // Update the client with the current program reference
      transaction.update(clientRef, { currentProgramRef: programRef });

      // Create days subcollection
      days.forEach((day: any, i: number) => {
        const dayRef = doc(programRef, "days", i.toString());
        const dayData = {
          adherence: day.adherence,
          date: day.date,
          exercises: day.exercises,
          finished: day.finished,
          phaseId: day.phaseId,
          dayId: day.id,
          restDay: day.restDay,
        };
        transaction.set(dayRef, dayData);
      });
    }

    // If you reach this point without errors, the transaction will commit automatically
    return true;
  });
}
// ! Deprecated
export async function clientDocumentListener(
  clientId: string,
  callback: () => Promise<void>
): Promise<Unsubscribe> {
  const clientRef = doc(db, "clients", clientId);

  const unsubscribe = onSnapshot(clientRef, async (doc) => {
    if (doc.exists()) {
      // Document exists, call the callback to handle the data
      await callback();
    } else {
      // Document does not exist
      const did = await convertUser(clientId);
      did && (await callback());
    }
  });

  return unsubscribe;
}

// export function clientDocumentListener(
//   clientId: string
//   // callBack: () => void
// ): Promise<{ clientExists: boolean | null; unsubscribe: () => void }> {
//   return new Promise((resolve) => {
//     const clientRef = doc(db, "clients", clientId);

//     const unsubscribe = onSnapshot(clientRef, (doc) => {
//       if (doc.exists()) {
//         // callBack();
//         // Document exists, you can handle the data here
//         resolve({ clientExists: true, unsubscribe });
//       } else {
//         // Document does not exist
//         resolve({ clientExists: false, unsubscribe });
//       }
//     });
//   });
// }
