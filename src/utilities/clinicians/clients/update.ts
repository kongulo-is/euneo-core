import { getDoc } from "firebase/firestore";
import {
  TClinicianClientRead,
  TClinicianClientRef,
} from "../../../entities/clinician/clinicianClient";
import { updateDoc } from "../../updateDoc";
import {
  prescriptionConverter,
  TPrescription,
} from "../../../entities/clinician/prescription";
import { TClientProgramRef } from "../../../entities/client/clientProgram";

/**
 * @description This function updates the client document in the database
 */
export async function updateClinicianClient(
  clinicianClientRef: TClinicianClientRef,
  clinicianClient: Partial<TClinicianClientRead>
): Promise<boolean> {
  try {
    await updateDoc(clinicianClientRef, clinicianClient);

    return true;
  } catch (error) {
    console.error("Error updating clinician client: ", error, {
      clinicianClientRef,
      clinicianClient,
    });
    throw error;
  }
}

export async function changeClinicianClientPrescription(
  clinicianClientRef: TClinicianClientRef,
  newPrescription: TPrescription
): Promise<boolean> {
  try {
    const prescriptionConverted =
      prescriptionConverter.toFirestore(newPrescription);

    await updateDoc(clinicianClientRef, {
      prescription: prescriptionConverted,
    });

    return true;
  } catch (error) {
    console.error("Error updating clinician client prescription: ", error, {
      clinicianClientRef,
      newPrescription,
    });
    return false;
  }
}

/**
 * @description used in app? // TODO: Explain what this function does, examples are great
 */
export async function updateClinicianClientPrescriptionStatus(
  clinicianClientRef: TClinicianClientRef,
  clientProgramRef: TClientProgramRef,
  status: TPrescription["status"]
): Promise<void> {
  try {
    const clinicianClient = await getDoc(clinicianClientRef);
    const prescription = {
      ...clinicianClient.data()?.prescription,
      clientProgramRef: clientProgramRef,
      status: status,
    };

    updateDoc(clinicianClientRef, {
      prescription: prescription,
    });
  } catch (error) {
    console.error("Error updating clinician client prescription: ", error, {
      clinicianClientRef,
      clientProgramRef,
      status,
    });
    throw error;
  }
}
