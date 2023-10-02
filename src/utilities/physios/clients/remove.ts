import {
  doc,
  DocumentReference,
  collection,
  CollectionReference,
  getDoc,
  addDoc,
  updateDoc,
  deleteField,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TPhysioClientWrite,
  TPrescriptionWrite,
} from "../../../types/physioTypes";

export async function removePhysioClientPrescription(
  physioClientId: string,
  physioId: string
): Promise<boolean> {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    // past prescription sub collection
    const pastPrescriptionRef = collection(
      physioClientRef,
      "pastPrescriptions"
    ) as CollectionReference<TPrescriptionWrite>;

    // get current prescription
    const physioClientSnapshot = await getDoc(physioClientRef);
    const currentPrescription: TPrescriptionWrite | undefined =
      physioClientSnapshot.data()?.prescription;

    if (currentPrescription) {
      // store current prescription in past prescription sub collection
      await addDoc(pastPrescriptionRef, currentPrescription);
      // delete current prescription
      await updateDoc(physioClientRef, {
        prescription: deleteField(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error removing prescription from physio client", error, {
      physioClientId,
      physioId,
    });
    return false;
  }
}

export async function removePhysioClient(
  physioId: string,
  physioClientId: string
): Promise<boolean> {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    // client can have sub collection of past prescriptions, delete the collection first
    const pastPrescriptionRef = collection(
      physioClientRef,
      "pastPrescriptions"
    ) as CollectionReference<TPrescriptionWrite>;

    const pastPrescriptionsSnapshot = await getDocs(pastPrescriptionRef);

    pastPrescriptionsSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    // delete client
    await deleteDoc(physioClientRef);
    return true;
  } catch (error) {
    console.error("Error removing client from physio", error, {
      physioId,
      physioClientId,
    });
    return false;
  }
}
