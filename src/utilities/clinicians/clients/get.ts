import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import { getClientProgram } from "../../clients/programs/get";
import { isEmptyObject } from "../../basicHelpers";
import {
  prescriptionConverter,
  TPrescriptionWrite,
} from "../../../entities/clinician/prescription";
import { TClientProgram } from "../../../entities/client/clientProgram";
import {
  clinicianClientConverter,
  createClinicianClientRef,
  deserializeClinicianClientPath,
  TClinicianClient,
  TClinicianClientBase,
  TClinicianClientRead,
  TClinicianClientWrite,
} from "../../../entities/clinician/clinicianClient";

async function _fetchClientProgram({
  clientData,
  skipMaintenanceData = false,
  maxNumberOfDays,
}: {
  clientData: TClinicianClientBase;
  maxNumberOfDays?: number;
  skipMaintenanceData?: boolean;
}): Promise<TClientProgram | undefined> {
  // Check if clientData.prescription exists and has a clientProgramRef
  const prescription = clientData.prescription;
  if (
    !prescription ||
    !("clientProgramRef" in prescription) ||
    !prescription.clientProgramRef
  ) {
    console.log("There is no client program", clientData);
    return;
  }

  try {
    const clientProgram = await getClientProgram(
      prescription.clientProgramRef,
      maxNumberOfDays,
      skipMaintenanceData
    );

    if (!clientProgram) {
      throw new Error("Client program data is undefined");
    }

    return clientProgram;
  } catch (error) {
    console.error("Error fetching client program:", error);
    throw error;
  }
}

export async function getClinicianClientPastPrescriptions(
  clinicianId: string,
  clinicianClientId: string
) {
  try {
    // get all past prescriptions in pastPrescription subcollection under /clinicians/{clinicianId}/clients/{clinicianClientId}/pastPrescriptions
    const clinicianClientPastPrescriptionsRef = collection(
      doc(db, "clinicians", clinicianId, "clients", clinicianClientId),
      "pastPrescriptions"
    ) as CollectionReference<TPrescriptionWrite>;
    const q = query(
      clinicianClientPastPrescriptionsRef,
      orderBy("prescriptionDate", "desc")
    );
    const snapshot = await getDocs(q);

    // get clients program data from programs subcollection to client.
    const pastPrescriptions = snapshot.docs.map((c) => {
      return prescriptionConverter.fromFirestore(c.data());
    });

    return pastPrescriptions;
  } catch (error) {
    console.error(
      "Error fetching Clinician client past prescriptions:",
      error,
      {
        clinicianId,
        clinicianClientId,
      }
    );
  }
}

// get single clinician client
export async function getClinicianClient(
  clinicianClientRef: DocumentReference<
    TClinicianClientRead,
    TClinicianClientWrite
  >,
  skipMaintenanceData: boolean = false
): Promise<TClinicianClient> {
  try {
    const clientSnap = await getDoc(
      clinicianClientRef.withConverter(clinicianClientConverter)
    );

    const clientData = clientSnap.data();
    if (!clientData) throw new Error("Client not found");

    const clientProgram = await _fetchClientProgram({
      clientData,
      skipMaintenanceData,
    });

    return {
      ...clientData,
      clinicianClientRef,
      clinicianClientIdentifiers: deserializeClinicianClientPath(
        clinicianClientRef.path
      ),
      ...(clientProgram && !isEmptyObject(clientProgram) && { clientProgram }),
    };
  } catch (error) {
    console.error("Error fetching client:", error, {
      clinicianClientRef,
    });
    throw error;
  }
}

// Get all clinician clients
export async function getClinicianClients(
  clinicianId: string
): Promise<TClinicianClient[]> {
  try {
    // Get clients data form clinician collection
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(clinicianRef, "clients");
    const q = query(clientsRef, orderBy("date", "desc")).withConverter(
      clinicianClientConverter
    );

    const snapshot = await getDocs(q);

    // get clients program data from programs subcollection to client.
    const clientsData: TClinicianClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        try {
          const clientData: TClinicianClientBase = c.data();
          const clientProgram = await _fetchClientProgram({
            clientData,
            maxNumberOfDays: 7,
            skipMaintenanceData: true,
          });

          const clinicianClientRef = createClinicianClientRef({
            clinicians: clinicianId,
            clients: c.id,
          });

          const clinicianClient: TClinicianClient = {
            ...clientData,
            clinicianClientRef,
            clinicianClientIdentifiers: deserializeClinicianClientPath(
              c.ref.path
            ),
            ...(clientProgram &&
              !isEmptyObject(clientProgram) && { clientProgram }),
          };

          return clinicianClient;
        } catch (error) {
          console.error("Error getting clients data:", error, c);
          throw new Error(error as any);
        }
      })
    ).catch((err) => {
      console.log("Error getting clients");

      console.error(err);
      return [];
    });

    return clientsData;
  } catch (error) {
    console.error("Error fetching clients:", error, {
      clinicianId,
    });
    return [];
  }
}
