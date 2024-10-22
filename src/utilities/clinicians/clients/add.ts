import {
  getDoc,
  collection,
  CollectionReference,
  addDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";

import { createInvitation } from "../../invitations/add";
import {
  TPrescription,
  TPrescriptionWrite,
  prescriptionConverter,
} from "../../../entities/clinician/prescription";
import {
  clinicianClientConverter,
  deserializeClinicianClientPath,
  TClinicianClient,
  TClinicianClientRead,
  TClinicianClientRef,
} from "../../../entities/clinician/clinicianClient";

export async function addPrescriptionToClinicianClient(
  clinicianClientRef: TClinicianClientRef,
  prescription: TPrescription,
  code: string,
  clinicianName: string,
  isGivingFreeMonth: boolean = false
) {
  try {
    let giftUsed = isGivingFreeMonth;
    // check if user has a current prescription
    const clinicianClientSnapshot = await getDoc(
      clinicianClientRef.withConverter(clinicianClientConverter)
    );

    const currentPrescription = clinicianClientSnapshot.data()?.prescription;
    const alreadyGotFreeMonth = clinicianClientSnapshot.data()?.oneMonthFree;
    // If client had already got free month, we will not grant him free month again
    if (alreadyGotFreeMonth) {
      giftUsed = false;
    }
    // store current prescription in past prescription sub collection if it was already started
    if (currentPrescription && currentPrescription.status === "Started") {
      const pastPrescriptionRef = collection(
        clinicianClientRef,
        "pastPrescriptions"
      ) as CollectionReference<TPrescriptionWrite>;
      const prescriptionWrite =
        prescriptionConverter.toFirestore(currentPrescription);
      await addDoc(pastPrescriptionRef, prescriptionWrite);
    }

    // change the clinician client's prescription
    const prescriptionConverted =
      prescriptionConverter.toFirestore(prescription);

    // send invitation to client and return the invitation id
    const invitation = await createInvitation(
      clinicianClientRef,
      code,
      clinicianName,
      giftUsed
    );

    await updateDoc(clinicianClientRef, {
      prescription: prescriptionConverted,
      ...(giftUsed && { oneMonthFree: true }),
    });

    return { invitation, giftUsed };
  } catch (error) {
    console.error(
      "Error adding prescription to clinician client",
      error,
      prescription,
      clinicianClientRef.path
    );

    return { invitation: null, giftUsed: false };
  }
}

export async function createClinicianClient(
  clinicianClientRef: TClinicianClientRef,
  data: TClinicianClientRead
): Promise<TClinicianClient> {
  try {
    await setDoc(clinicianClientRef, data);

    return {
      ...data,
      clinicianClientRef,
      clinicianClientIdentifiers: deserializeClinicianClientPath(
        clinicianClientRef.path
      ),
    };
  } catch (error) {
    console.error("Error adding clinician client:", error, {
      data,
    });
    throw error;
  }
}
