import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClient } from "../../types/clientTypes";

export async function checkIfClientExists(clientId: string): Promise<boolean> {
  try {
    const clientRef = doc(db, "clients", clientId);

    const clientDoc = await getDoc(clientRef);

    return clientDoc.exists();
  } catch (error) {
    console.error("Error checking if client exists: ", error, { clientId });
    throw error;
  }
}

export async function getClient(clientId: string): Promise<TClient> {
  const clientRef = doc(db, "clients", clientId) as DocumentReference<TClient>;

  const clientDoc = await getDoc(clientRef);

  console.log("userDoc.data()", clientDoc.data());

  const clientData = clientDoc.data();

  if (!clientData) {
    throw new Error("No client found");
  }

  const client = {
    ...clientData,
    clientId: clientId,
  };

  return client;
}

export async function clientDocumentListener(
  clientId: string,
  callback: () => Promise<void>
): Promise<void> {
  const clientRef = doc(db, "clients", clientId);

  onSnapshot(clientRef, async (doc) => {
    if (doc.exists()) {
      // Document exists, call the callback to handle the data
      await callback();
    } else {
      // Document does not exist
      // Handle the absence of the document if needed
      console.log("User does not exist");
    }
  });
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
