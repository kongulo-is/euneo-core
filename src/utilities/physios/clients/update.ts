import {
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TPhysioClientRead,
  TPhysioClientWrite,
  TPrescription,
  TPrescriptionWrite,
} from "../../../types/physioTypes";
import { physioClientConverter } from "../../converters";
import { TClientProgramWrite } from "../../../types/clientTypes";

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

export async function updatePhysioClientPrescriptionStatus(
  physioId: string,
  physioClientId: string,
  clientId: string,
  clientProgramId: string,
  status: TPrescription["status"]
): Promise<void> {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    const physioClient = await getDoc(physioClientRef);
    const prescription = {
      ...physioClient.data()?.prescription,
      clientProgramRef: doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgramId
      ) as DocumentReference<TClientProgramWrite, DocumentData>,
      status: status,
    };

    updateDoc(physioClientRef, {
      prescription: prescription,
    });
  } catch (error) {
    console.error("Error updating physio client prescription: ", error, {
      physioClientId,
      physioId,
      clientId,
      clientProgramId,
    });
    throw error;
  }
}
