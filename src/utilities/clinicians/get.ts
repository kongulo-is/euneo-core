import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClinician } from "../../types/clinicianTypes";

export async function getAllCliniciansIds(): Promise<string[]> {
  try {
    const cliniciansRef = collection(
      db,
      "clinicians"
    ) as CollectionReference<TClinician>;

    const cliniciansDoc = await getDocs(cliniciansRef);

    const clinicians = cliniciansDoc.docs.map((clinician) => clinician.id);

    return clinicians;
  } catch (error) {
    console.error("Error fetching clinicians", error);
    throw error;
  }
}

export async function getClinician(clinicianId: string): Promise<TClinician> {
  try {
    const clinicianRef = doc(
      db,
      "clinicians",
      clinicianId
    ) as DocumentReference<TClinician>;

    const clinicianDoc = await getDoc(clinicianRef);

    const clinician = clinicianDoc.data();

    if (!clinician) throw new Error("No clinician found");

    return clinician;
  } catch (error) {
    console.error("Error fetching clinician", error, { clinicianId });
    throw error;
  }
}

export async function checkIfClinicianExists(
  clinicianId: string
): Promise<boolean> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);

    const clinicianDoc = await getDoc(clinicianRef);

    return clinicianDoc.exists();
  } catch (error) {
    console.error("Error fetching clinician", error, { clinicianId });
    throw error;
  }
}
