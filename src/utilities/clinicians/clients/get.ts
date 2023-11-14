import {
  collection,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TClientProgram, TClientWrite } from "../../../types/clientTypes";
import {
  TClinicianClient,
  TClinicianClientBase,
  TClinicianClientWrite,
} from "../../../types/clinicianTypes";
import { clinicianClientConverter } from "../../converters";
import { getClientProgram } from "../../clients/programs/get";

async function _clientProgram({
  clientData,
}: {
  clientData: TClinicianClientBase;
}) {
  // get clients program data.
  let clientProgram: TClientProgram | undefined;

  console.log("clientData.prescription", clientData);

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

  console.log("clientProgram", clientProgram);

  return clientProgram;
}

// get single clinician client
export async function geTClinicianClient(
  cliniciansId: string,
  clinicianClientId: string
): Promise<TClinicianClient> {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      cliniciansId,
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
      ...(clientProgram && { clientProgram }),
    };
  } catch (error) {
    console.error("Error fetching client:", error, {
      cliniciansId,
      clinicianClientId,
    });
  }

  return {} as TClinicianClient;
}

// Get all clinician clients
export async function geTClinicianClients(
  cliniciansId: string
): Promise<TClinicianClient[]> {
  try {
    // Get clients data form clinician collection
    const clinicianRef = doc(db, "clinicians", cliniciansId);
    const clientsRef = collection(clinicianRef, "clients");
    const snapshot = await getDocs(
      clientsRef.withConverter(clinicianClientConverter)
    );

    console.log("snapshot.docs", snapshot.docs);

    // get clients program data from programs subcollection to client.
    const clientsData: TClinicianClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        const clientData: TClinicianClientBase = c.data();
        console.log("clientData", clientData);

        const clientProgram = await _clientProgram({ clientData });
        console.log("clientProgram", clientProgram);

        return {
          ...clientData,
          clinicianClientId: c.id,
          ...(clientProgram && { clientProgram }),
        };
      })
    ).catch((err) => {
      console.error(err);
      return [];
    });

    return clientsData;
  } catch (error) {
    console.error("Error fetching clients:", error, {
      cliniciansId,
    });
    return [];
  }
}
