import { DocumentReference, deleteField, doc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClinicianWrite } from "../../types/clinicianTypes";
import { updateDoc } from "../updateDoc";

export async function removeUpgradeNeededFromClinician(clinicianId: string) {
  const clinicianRef = doc(
    db,
    "clinicians",
    clinicianId
  ) as DocumentReference<TClinicianWrite>;

  return await updateDoc(clinicianRef, {
    upgradeNeeded: deleteField(),
  })
    .then(() => true)
    .catch(() => false);
}
