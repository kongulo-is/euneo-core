import {
  doc,
  getDoc,
  collection,
  CollectionReference,
  addDoc,
  updateDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";

import { createInvitation } from "../../invitations/add";
import {
  TPrescription,
  TPrescriptionRead,
  TPrescriptionWrite,
  prescriptionConverter,
} from "../../../entities/clinician/prescription";
import {
  clinicianClientConverter,
  createClinicianClientRef,
  deserializeClinicianClientPath,
  TClinicianClient,
  TClinicianClientRead,
  TClinicianClientRef,
} from "../../../entities/clinician/clinicianClient";

export async function addPrescriptionToClinicianClient(
  clinicianClientRef: TClinicianClientRef,
  prescription: TPrescription,
  code: string,
) {
  try {
    console.log("clinicianClientRef", clinicianClientRef);

    // check if user has a current prescription
    const clinicianClientSnapshot = await getDoc(
      clinicianClientRef.withConverter(clinicianClientConverter),
    );

    const currentPrescription = clinicianClientSnapshot.data()?.prescription;
    if (currentPrescription && currentPrescription.status === "Started") {
      // store current prescription in past prescription sub collection if it was already started
      const pastPrescriptionRef = collection(
        clinicianClientRef,
        "pastPrescriptions",
      ) as CollectionReference<TPrescriptionRead, TPrescriptionWrite>;
      await addDoc(pastPrescriptionRef, currentPrescription);
    }

    // change the clinician client's prescription
    const prescriptionConverted =
      prescriptionConverter.toFirestore(prescription);

    console.log("!!!prescriptionConverted", prescriptionConverted);

    await updateDoc(clinicianClientRef, {
      prescription: prescriptionConverted,
    });

    // send invitation to client and return the invitation id
    const invitationId = await createInvitation(clinicianClientRef, code);

    return invitationId;
  } catch (error) {
    console.error(
      "Error adding prescription to clinician client",
      error,
      prescription,
      clinicianClientRef.path,
    );

    return false;
  }
}

export async function createClinicianClient(
  clinicianId: string,
  data: TClinicianClientRead,
): Promise<TClinicianClient> {
  try {
    const clinicianClientRef = createClinicianClientRef({
      clinicians: clinicianId,
    });

    await setDoc(clinicianClientRef, data);

    return {
      ...data,
      clinicianClientRef,
      clinicianClientIdentifiers: deserializeClinicianClientPath(
        clinicianClientRef.path,
      ),
    };
  } catch (error) {
    console.error("Error adding clinician client:", error, {
      data,
    });
    throw error;
  }
}

//TODO: TEMOPORARY FUNCTION
export async function moveClinicianClientsToNewClinician(
  clinicianId: string,
): Promise<void> {
  try {
    // 1. get all clients from phsyios/clinicianId/clients
    const physioRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(physioRef, "clients");
    const clientsSnapshot = await getDocs(
      clientsRef.withConverter(clinicianClientConverter),
    );
    const clients = clientsSnapshot.docs.map((client) => client.data());
    // 2. add all clients to clinicians/clinicianId/clients
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clinicianClientsRef = collection(clinicianRef, "clients");
    clients.forEach(async (client) => {
      delete client.prescription;
      await addDoc(
        clinicianClientsRef.withConverter(clinicianClientConverter),
        client,
      );
    });
  } catch (error) {
    console.error("Error moving clinician clients to new clinician:", error, {
      clinicianId,
    });
    throw error;
  }
}
