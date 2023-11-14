import { doc, DocumentReference, getDoc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClinician } from "../../types/clinicianTypes";

export async function geTClinician(cliniciansId: string): Promise<TClinician> {
  try {
    const clinicianRef = doc(
      db,
      "clinicians",
      cliniciansId
    ) as DocumentReference<TClinician>;

    const clinicianDoc = await getDoc(clinicianRef);

    const clinician = clinicianDoc.data();

    if (!clinician) throw new Error("No clinician found");

    return clinician;
  } catch (error) {
    console.error("Error fetching clinician", error, { cliniciansId });
    throw error;
  }
}

export async function checkIfClinicianExists(
  cliniciansId: string
): Promise<boolean> {
  try {
    const clinicianRef = doc(db, "clinicians", cliniciansId);

    const clinicianDoc = await getDoc(clinicianRef);

    return clinicianDoc.exists();
  } catch (error) {
    console.error("Error fetching clinician", error, { cliniciansId });
    throw error;
  }
}
