import {
  doc,
  DocumentReference,
  getDoc,
  collection,
  CollectionReference,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TPhysioClient,
  TPhysioClientRead,
  TPhysioClientWrite,
  TPrescription,
  TPrescriptionWrite,
} from "../../../types/physioTypes";
import { physioClientConverter, prescriptionConverter } from "../../converters";

export async function addPrescriptionToPhysioClient(
  physioId: string,
  physioClientId: string,
  prescription: TPrescription
) {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    // check if user has a current prescription
    const physioClientSnapshot = await getDoc(physioClientRef);
    const currentPrescription = physioClientSnapshot.data()?.prescription;
    if (currentPrescription) {
      // store current prescription in past prescription sub collection
      const pastPrescriptionRef = collection(
        physioClientRef,
        "pastPrescriptions"
      ) as CollectionReference<TPrescriptionWrite>;
      await addDoc(pastPrescriptionRef, currentPrescription);
    }

    // change the physio client's prescription
    const prescriptionConverted =
      prescriptionConverter.toFirestore(prescription);

    await updateDoc(physioClientRef, {
      prescription: prescriptionConverted,
    });

    // Create invitation for client
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const invitationRef = collection(db, "invitations");
    await addDoc(invitationRef, {
      physioClientRef,
      code,
    });

    return true;
  } catch (error) {
    console.error(
      "Error adding prescription to physio client",
      error,
      prescription,
      physioId,
      physioClientId
    );

    throw error;
  }
}

export async function createPhysioClient(
  data: TPhysioClientRead,
  physioId: string
): Promise<TPhysioClient> {
  try {
    const physioRef = doc(db, "physios", physioId);
    const clientsRef = collection(physioRef, "clients");
    const clientRef = await addDoc(
      clientsRef.withConverter(physioClientConverter),
      data
    );
    return {
      ...data,
      physioClientId: clientRef.id,
    };
  } catch (error) {
    console.error("Error adding physio client:", error, {
      data,
    });
    throw error;
  }
}
