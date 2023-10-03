import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/db";

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
