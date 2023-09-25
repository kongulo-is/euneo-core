import { doc, DocumentReference, getDoc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClient } from "../../types/clientTypes";

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
