import {
  doc,
  DocumentReference,
  getDoc,
  collection,
  CollectionReference,
  addDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClinicianClient,
  TClinicianClientRead,
  TClinicianClientWrite,
  TPrescription,
  TPrescriptionWrite,
} from "../../../types/clinicianTypes";
import {
  clinicianClientConverter,
  prescriptionConverter,
} from "../../converters";
import { createInvitation } from "../../invitations/add";

export async function addPrescriptionToClinicianClient(
  clinicianId: string,
  clinicianClientId: string,
  prescription: TPrescription,
  code: string
) {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      clinicianId,
      "clients",
      clinicianClientId
    ) as DocumentReference<TClinicianClientWrite>;

    // check if user has a current prescription
    const clinicianClientSnapshot = await getDoc(clinicianClientRef);
    const currentPrescription = clinicianClientSnapshot.data()?.prescription;
    if (currentPrescription) {
      // store current prescription in past prescription sub collection
      const pastPrescriptionRef = collection(
        clinicianClientRef,
        "pastPrescriptions"
      ) as CollectionReference<TPrescriptionWrite>;
      await addDoc(pastPrescriptionRef, currentPrescription);
    }

    // change the clinician client's prescription
    const prescriptionConverted =
      prescriptionConverter.toFirestore(prescription);

    await updateDoc(clinicianClientRef, {
      prescription: prescriptionConverted,
    });

    // send invitation to client and return the invitation id
    const invitationId = await createInvitation(
      clinicianId,
      clinicianClientId,
      code
    );

    return invitationId;
  } catch (error) {
    console.error(
      "Error adding prescription to clinician client",
      error,
      prescription,
      clinicianId,
      clinicianClientId
    );

    return false;
  }
}

export async function createClinicianClient(
  data: TClinicianClientRead,
  clinicianId: string
): Promise<TClinicianClient> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(clinicianRef, "clients");
    const clientRef = await addDoc(
      clientsRef.withConverter(clinicianClientConverter),
      data
    );
    return {
      ...data,
      clinicianClientId: clientRef.id,
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
  clinicianId: string
): Promise<void> {
  try {
    // 1. get all clients from phsyios/clinicianId/clients
    const physioRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(physioRef, "clients");
    const clientsSnapshot = await getDocs(
      clientsRef.withConverter(clinicianClientConverter)
    );
    const clients = clientsSnapshot.docs.map((client) => client.data());
    // 2. add all clients to clinicians/clinicianId/clients
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clinicianClientsRef = collection(clinicianRef, "clients");
    clients.forEach(async (client) => {
      delete client.prescription;
      await addDoc(
        clinicianClientsRef.withConverter(clinicianClientConverter),
        client
      );
    });
  } catch (error) {
    console.error("Error moving clinician clients to new clinician:", error, {
      clinicianId,
    });
    throw error;
  }
}
