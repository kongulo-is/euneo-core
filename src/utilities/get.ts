import {
  CollectionReference,
  DocumentReference,
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/db";
import { TPhysio } from "../types/physioTypes";
import { TClient } from "../types/clientTypes";

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

export async function getPhysio(physioId: string): Promise<TPhysio> {
  try {
    const physioRef = doc(
      db,
      "physios",
      physioId
    ) as DocumentReference<TPhysio>;

    const physioDoc = await getDoc(physioRef);

    const physio = physioDoc.data();

    if (!physio) throw new Error("No physio found");

    return physio;
  } catch (error) {
    console.error("Error fetching physio", error, { physioId });
    throw error;
  }
}

export async function checkIfPhysioExists(physioId: string): Promise<boolean> {
  try {
    const physioRef = doc(db, "physios", physioId);

    const physioDoc = await getDoc(physioRef);

    return physioDoc.exists();
  } catch (error) {
    console.error("Error fetching physio", error, { physioId });
    throw error;
  }
}
