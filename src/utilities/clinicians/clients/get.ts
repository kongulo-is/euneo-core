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
import { TClientProgram } from "../../../types/clientTypes";
import {
  TClinicianClient,
  TClinicianClientBase,
  TClinicianClientWrite,
  TPrescriptionWrite,
} from "../../../types/clinicianTypes";
import {
  clinicianClientConverter,
  oldClinicianClientConverter,
  oldPrescriptionConverter,
  prescriptionConverter,
} from "../../converters";
import {
  getClientProgram,
  getDeprecatedClientProgram,
} from "../../clients/programs/get";
import { isEmptyObject } from "../../basicHelpers";
import { _getDeprecatedProgramFromRef } from "../../programHelpers";

async function _clientProgram(
  {
    clientData,
    skipMaintenanceData = false,
  }: {
    clientData: TClinicianClientBase;
    maxNumberOfDays?: number;
    skipMaintenanceData?: boolean;
  },
  maxNumberOfDays?: number
) {
  // get clients program data.
  let clientProgram: TClientProgram | undefined;

  // Get client program data if client has accepted a prescription
  if (
    clientData.prescription?.clientId &&
    clientData.prescription?.clientProgramId
  ) {
    if (clientData.prescription?.version) {
      const clientProgramWithDays = await getClientProgram(
        clientData.prescription.clientId,
        clientData.prescription.clientProgramId,
        maxNumberOfDays,
        skipMaintenanceData
      );
      clientProgram = clientProgramWithDays;
    } else {
      console.error("No version! need to upgrade program...");
    }
  }

  return clientProgram;
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
  clinicianId: string,
  clinicianClientId: string,
  skipMaintenanceData: boolean = false
): Promise<TClinicianClient> {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      clinicianId,
      "clients",
      clinicianClientId
    ) as DocumentReference<TClinicianClientWrite>;

    const clientSnap = await getDoc(
      clinicianClientRef.withConverter(clinicianClientConverter)
    );

    const clientData = clientSnap.data();
    if (!clientData) throw new Error("Client not found");

    const clientProgram = await _clientProgram({
      clientData,
      skipMaintenanceData,
    });

    return {
      ...clientData,
      clinicianClientId: clientSnap.id,
      ...(clientProgram && !isEmptyObject(clientProgram) && { clientProgram }),
    };
  } catch (error) {
    console.error("Error fetching client:", error, {
      clinicianId,
      clinicianClientId,
    });
  }

  return {} as TClinicianClient;
}

// Get all clinician clients
export async function getClinicianClients(
  clinicianId: string,
  includeClinicianId: boolean = false
): Promise<TClinicianClient[]> {
  try {
    // Get clients data form clinician collection
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(clinicianRef, "clients");
    const q = query(clientsRef, orderBy("date", "desc")).withConverter(
      clinicianClientConverter
    );
    const snapshot = await getDocs(
      // clientsRef.withConverter(clinicianClientConverter)
      q
    );

    // get clients program data from programs subcollection to client.
    const clientsData: TClinicianClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        try {
          const clientData: TClinicianClientBase = c.data();
          const clientProgram = await _clientProgram({ clientData }, 7);

          return {
            ...clientData,
            clinicianClientId: c.id,
            ...(includeClinicianId && { clinicianId }),
            ...(clientProgram &&
              !isEmptyObject(clientProgram) && { clientProgram }),
          };
        } catch (error) {
          console.error("Error getting clients data:", error, c);
          throw new Error(error as any);
        }
      })
    ).catch((err) => {
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
      clientData.prescription.clientProgramId
    );
    clientProgram = clientProgramWithDays;
  }

  return clientProgram;
}
// Get all clinician clients
export async function getDeprecatedClinicianClients(
  clinicianId: string
): Promise<TClinicianClient[]> {
  try {
    // Get clients data form clinician collection
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const clientsRef = collection(clinicianRef, "clients");
    const q = query(clientsRef, orderBy("date", "desc")).withConverter(
      oldClinicianClientConverter
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
      })
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
      }
    );
  }
}
