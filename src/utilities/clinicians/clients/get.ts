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

import {
  oldClinicianClientConverter,
  oldPrescriptionConverter,
} from "../../converters";
import {
  getClientProgram,
  getDeprecatedClientProgram,
} from "../../clients/programs/get";
import { isEmptyObject } from "../../basicHelpers";
import { _getDeprecatedProgramFromRef } from "../../programHelpers";
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
      skipMaintenanceData,
    );

    if (!clientProgram) {
      throw new Error("Client program data is undefined");
    }

    console.log("Fetched client program:", clientProgram);
    return clientProgram;
  } catch (error) {
    console.error("Error fetching client program:", error);
    throw error;
  }
}

export async function getClinicianClientPastPrescriptions(
  clinicianId: string,
  clinicianClientId: string,
) {
  try {
    // get all past prescriptions in pastPrescription subcollection under /clinicians/{clinicianId}/clients/{clinicianClientId}/pastPrescriptions
    const clinicianClientPastPrescriptionsRef = collection(
      doc(db, "clinicians", clinicianId, "clients", clinicianClientId),
      "pastPrescriptions",
    ) as CollectionReference<TPrescriptionWrite>;
    const q = query(
      clinicianClientPastPrescriptionsRef,
      orderBy("prescriptionDate", "desc"),
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
      },
    );
  }
}

// get single clinician client
export async function getClinicianClient(
  clinicianClientRef: DocumentReference<
    TClinicianClientRead,
    TClinicianClientWrite
  >,
  skipMaintenanceData: boolean = false,
): Promise<TClinicianClient> {
  try {
    const clientSnap = await getDoc(
      clinicianClientRef.withConverter(clinicianClientConverter),
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
        clinicianClientRef.path,
      ),
      ...(clientProgram && !isEmptyObject(clientProgram) && { clientProgram }),
    };
  } catch (error) {
    console.error("Error fetching client:", error, {
      clinicianClientRef,
    });
  }

  return {} as TClinicianClient;
}

// Get all clinician clients
export async function getClinicianClients(
  clinicianId: string,
): Promise<TClinicianClient[]> {
  try {
    // Get clients data form clinician collection
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(clinicianRef, "clients");
    const q = query(clientsRef, orderBy("date", "desc")).withConverter(
      clinicianClientConverter,
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
              c.ref.path,
            ),
            ...(clientProgram &&
              !isEmptyObject(clientProgram) && { clientProgram }),
          };

          return clinicianClient;
        } catch (error) {
          console.error("Error getting clients data:", error, c);
          throw new Error(error as any);
        }
      }),
    ).catch((err) => {
      console.log("Error getting clients");

      console.error(err);
      return [];
    });

    console.log("clientsData in getAllCliniciansClients", clientsData);

    return clientsData;
  } catch (error) {
    console.error("Error fetching clients:", error, {
      clinicianId,
    });
    return [];
  }
}

// TODO: Functions for deprecated data
async function _deprecatedClientProgram({
  clientData,
}: {
  clientData: TClinicianClientBase;
}) {
  // get clients program data.
  let clientProgram: TClientProgram | undefined;

  // Get client program data if client has accepted a prescription
  if (
    clientData.prescription?.clientId &&
    clientData.prescription?.clientProgramId
  ) {
    const clientProgramWithDays = await getDeprecatedClientProgram(
      clientData.prescription.clientId,
      clientData.prescription.clientProgramId,
    );
    clientProgram = clientProgramWithDays;
  }

  return clientProgram;
}
// Get all clinician clients
export async function getDeprecatedClinicianClients(
  clinicianId: string,
): Promise<TClinicianClient[]> {
  try {
    // Get clients data form clinician collection
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(clinicianRef, "clients");
    const q = query(clientsRef, orderBy("date", "desc")).withConverter(
      oldClinicianClientConverter,
    );
    const snapshot = await getDocs(q);

    // get clients program data from programs subcollection to client.
    const clientsData: TClinicianClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        try {
          const clientData: TClinicianClientBase = c.data();
          // Clients with already upgraded prescriptions are returned as empty objects
          if (clientData.prescription?.version) {
            return {} as TClinicianClient;
          }
          const clientProgram = await _deprecatedClientProgram({ clientData });

          return {
            ...clientData,
            clinicianClientId: c.id,
            ...(clientProgram &&
              !isEmptyObject(clientProgram) && { clientProgram }),
          };
        } catch (error) {
          console.error("Error getting clients data:", error, c);
          throw new Error(error as any);
        }
      }),
    ).catch((err) => {
      console.error(err);
      return [];
    });
    return clientsData.filter((client) => !isEmptyObject(client));
  } catch (error) {
    console.error("Error fetching clients:", error, {
      clinicianId,
    });
    return [];
  }
}

export async function getDeprecatedClinicianClientPastPrescriptions(
  clinicianId: string,
  clinicianClientId: string,
) {
  try {
    // get all past prescriptions in pastPrescription subcollection under /clinicians/{clinicianId}/clients/{clinicianClientId}/pastPrescriptions
    const clinicianClientPastPrescriptionsRef = collection(
      doc(db, "clinicians", clinicianId, "clients", clinicianClientId),
      "pastPrescriptions",
    ) as CollectionReference<TPrescriptionWrite>;
    const q = query(
      clinicianClientPastPrescriptionsRef,
      orderBy("prescriptionDate", "desc"),
    );
    const snapshot = await getDocs(q);

    // get clients program data from programs subcollection to client.
    const pastPrescriptions = snapshot.docs.map((c) => {
      return { ...oldPrescriptionConverter.fromFirestore(c.data()), id: c.id };
    });

    return pastPrescriptions;
  } catch (error) {
    console.error(
      "Error fetching Clinician client past prescriptions:",
      error,
      {
        clinicianId,
        clinicianClientId,
      },
    );
  }
}
