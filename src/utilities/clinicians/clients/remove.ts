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
  TClinicianClientWrite,
  TPrescriptionWrite,
} from "../../../types/clinicianTypes";

export async function removeClinicianClientPrescription(
  clinicianClientId: string,
  cliniciansId: string
): Promise<boolean> {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      cliniciansId,
      "clients",
      clinicianClientId
    ) as DocumentReference<TClinicianClientWrite>;

    // past prescription sub collection
    const pastPrescriptionRef = collection(
      clinicianClientRef,
      "pastPrescriptions"
    ) as CollectionReference<TPrescriptionWrite>;

    // get current prescription
    const clinicianClientSnapshot = await getDoc(clinicianClientRef);
    const currentPrescription: TPrescriptionWrite | undefined =
      clinicianClientSnapshot.data()?.prescription;

    if (currentPrescription) {
      // store current prescription in past prescription sub collection
      await addDoc(pastPrescriptionRef, currentPrescription);
      // delete current prescription
      await updateDoc(clinicianClientRef, {
        prescription: deleteField(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error removing prescription from clinician client", error, {
      clinicianClientId,
      cliniciansId,
    });
    return false;
  }
}

export async function removeClinicianClient(
  cliniciansId: string,
  clinicianClientId: string
): Promise<boolean> {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      cliniciansId,
      "clients",
      clinicianClientId
    ) as DocumentReference<TClinicianClientWrite>;

    // client can have sub collection of past prescriptions, delete the collection first
    const pastPrescriptionRef = collection(
      clinicianClientRef,
      "pastPrescriptions"
    ) as CollectionReference<TPrescriptionWrite>;

    const pastPrescriptionsSnapshot = await getDocs(pastPrescriptionRef);

    pastPrescriptionsSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    // delete client
    await deleteDoc(clinicianClientRef);
    return true;
  } catch (error) {
    console.error("Error removing client from clinician", error, {
      cliniciansId,
      clinicianClientId,
    });
    return false;
  }
}
