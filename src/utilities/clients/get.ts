import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { clientConverter, type TClient } from "../../entities/client/client";

/**
 * @description Used in app? //TODO: add description
 */
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

/**
 * @description Used in app? //TODO: add description
 */
export async function getClient(clientId: string): Promise<TClient> {
  const clientRef = doc(db, "clients", clientId);

  const clientDoc = await getDoc(clientRef.withConverter(clientConverter));

  const clientData = clientDoc.data();
  if (!clientData) {
    throw new Error("No client found");
  }

  const client: TClient = {
    ...clientData,
    clientId: clientId,
  };

  return client;
}

/**
 * @description Get all clients that have currentClientProgramRef set. Used for migration purposes only
 */
export async function getAllClientsWithCurrentClientProgramRef(): Promise<
  TClient[]
> {
  const clientsCollection = collection(db, "clients");
  const clientsQuery = query(
    clientsCollection,
    // where("currentClientProgramRef", "!=", null),
    where("currentProgramRef", "!=", null),
    orderBy("name", "asc")
  );
  const clientsSnapshot = await getDocs(
    clientsQuery.withConverter(clientConverter)
  );

  return clientsSnapshot.docs.map((doc) => ({
    ...doc.data(),
    clientId: doc.id,
  }));
}
