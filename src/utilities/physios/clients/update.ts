import { doc, DocumentReference, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TPhysioClientRead,
  TPhysioClientWrite,
} from "../../../types/physioTypes";
import { physioClientConverter } from "../../converters";

export async function updatePhysioClient(
  physioId: string,
  physioClientId: string,
  physioClient: TPhysioClientRead
): Promise<boolean> {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    const physioClientConverted =
      physioClientConverter.toFirestore(physioClient);

    await updateDoc(physioClientRef, physioClientConverted);

    return true;
  } catch (error) {
    console.error("Error updating physio client: ", error, {
      physioClientId,
      physioId,
      physioClient,
    });
    throw error;
  }
}
