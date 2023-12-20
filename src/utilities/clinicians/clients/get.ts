import {
  collection,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TClientProgram } from "../../../types/clientTypes";
import {
  TClinicianClient,
  TClinicianClientBase,
  TClinicianClientWrite,
} from "../../../types/clinicianTypes";
import { clinicianClientConverter } from "../../converters";
import { getClientProgram } from "../../clients/programs/get";
import { isEmptyObject } from "../../basicHelpers";

async function _clientProgram({
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
    const clientProgramWithDays = await getClientProgram(
      clientData.prescription.clientId,
      clientData.prescription.clientProgramId
    );
    clientProgram = clientProgramWithDays;
  }

  return clientProgram;
}

// get single clinician client
export async function getClinicianClient(
  clinicianId: string,
  clinicianClientId: string
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

    const clientProgram = await _clientProgram({ clientData });

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
    const snapshot = await getDocs(
      clientsRef.withConverter(clinicianClientConverter)
    );

    // get clients program data from programs subcollection to client.
    const clientsData: TClinicianClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        const clientData: TClinicianClientBase = c.data();
        const clientProgram = await _clientProgram({ clientData });

        return {
          ...clientData,
          clinicianClientId: c.id,
          ...(includeClinicianId && { clinicianId }),
          ...(clientProgram &&
            !isEmptyObject(clientProgram) && { clientProgram }),
        };
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
