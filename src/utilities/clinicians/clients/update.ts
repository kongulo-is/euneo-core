import { getDoc } from "firebase/firestore";
import {
  clinicianClientConverter,
  TClinicianClientRead,
  TClinicianClientRef,
  TClinicianClientWrite,
} from "../../../entities/clinician/clinicianClient";
import { updateDoc } from "../../updateDoc";
import {
  prescriptionConverter,
  TPrescription,
  TPrescriptionRead,
  TPrescriptionWrite,
} from "../../../entities/clinician/prescription";
import { TClientProgramRef } from "../../../entities/client/clientProgram";

/**
 * @description This function updates the client document in the database
 */
export async function updateClinicianClient(
  clinicianClientRef: TClinicianClientRef,
  clinicianClient: Partial<TClinicianClientWrite>
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
  status: TPrescription["status"],
  clientProgramRef?: TClientProgramRef
): Promise<void> {
  try {
    const clinicianClient = await getDoc(clinicianClientRef);
    const clinicianClientData = clinicianClient.data();
    if (!clinicianClientData)
      throw new Error("Clinician client data not found");
    if (!("prescription" in clinicianClientData))
      throw new Error("Prescription not found");

    const { prescription } = clinicianClientData;
    if (!prescription) throw new Error("Prescription not found");

    const updatedPrescription: TPrescriptionWrite =
      prescriptionConverter.toFirestore({
        ...prescription,
        ...(clientProgramRef && { clientProgramRef: clientProgramRef }),
        status: status,
      });

    updateDoc(clinicianClientRef, {
      prescription: updatedPrescription,
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
