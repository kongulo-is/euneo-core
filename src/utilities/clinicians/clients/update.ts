import {
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClinicianClientRead,
  TClinicianClientWrite,
  TPrescription,
  TPrescriptionWrite,
} from "../../../types/clinicianTypes";
import { clinicianClientConverter } from "../../converters";
import { TClientProgramWrite } from "../../../types/clientTypes";

export async function updateClinicianClient(
  cliniciansId: string,
  clinicianClientId: string,
  clinicianClient: TClinicianClientRead
): Promise<boolean> {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      cliniciansId,
      "clients",
      clinicianClientId
    ) as DocumentReference<TClinicianClientWrite>;

    const clinicianClientConverted =
      clinicianClientConverter.toFirestore(clinicianClient);

    await updateDoc(clinicianClientRef, clinicianClientConverted);

    return true;
  } catch (error) {
    console.error("Error updating clinician client: ", error, {
      clinicianClientId,
      cliniciansId,
      clinicianClient,
    });
    throw error;
  }
}

export async function updateClinicianClientPrescriptionStatus(
  cliniciansId: string,
  clinicianClientId: string,
  clientId: string,
  clientProgramId: string,
  status: TPrescription["status"]
): Promise<void> {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      cliniciansId,
      "clients",
      clinicianClientId
    ) as DocumentReference<TClinicianClientWrite>;

    const clinicianClient = await getDoc(clinicianClientRef);
    const prescription = {
      ...clinicianClient.data()?.prescription,
      clientProgramRef: doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgramId
      ) as DocumentReference<TClientProgramWrite, DocumentData>,
      status: status,
    };

    updateDoc(clinicianClientRef, {
      prescription: prescription,
    });
  } catch (error) {
    console.error("Error updating clinician client prescription: ", error, {
      clinicianClientId,
      cliniciansId,
      clientId,
      clientProgramId,
    });
    throw error;
  }
}
