import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/db";

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
