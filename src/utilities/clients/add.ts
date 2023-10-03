import { DocumentReference, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClientPreferences, TClientWrite } from "../../types/clientTypes";
import { updateDoc } from "../updateDoc";

export const addClientPreferences = async (
  clientId: string,
  preferences: TClientPreferences
) => {
  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<TClientWrite>;

  await updateDoc(clientRef, {
    preferences,
  });
};

export async function createClientDocument(
  clientId: string,
  name: string,
  platform: string
) {
  try {
    const clientRef = doc(db, "clients", clientId);
    await setDoc(clientRef, {
      name,
      platform,
    });
  } catch (error) {
    console.error("Error creating client document: ", error, {
      clientId,
      name,
    });
    throw error;
  }
}
