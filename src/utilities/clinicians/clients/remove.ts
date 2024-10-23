import {
  collection,
  CollectionReference,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

import { TClinicianClientRef } from "../../../entities/clinician/clinicianClient";
import { TPrescriptionWrite } from "../../../entities/clinician/prescription";

export async function removeClinicianClient(
  clinicianClientRef: TClinicianClientRef
): Promise<boolean> {
  try {
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
    console.error(
      "Error removing client from clinician",
      error,
      clinicianClientRef.path
    );
    return false;
  }
}
