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
  TPhysioClient,
  TPhysioClientBase,
  TPhysioClientWrite,
} from "../../../types/physioTypes";
import { physioClientConverter } from "../../converters";
import { getClientProgram } from "../../clients/programs/get";

async function _clientProgram({
  clientData,
}: {
  clientData: TPhysioClientBase;
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

// get single physio client
export async function getPhysioClient(
  physioId: string,
  physioClientId: string
): Promise<TPhysioClient> {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    const clientSnap = await getDoc(
      physioClientRef.withConverter(physioClientConverter)
    );

    const clientData = clientSnap.data();
    if (!clientData) throw new Error("Client not found");

    const clientProgram = await _clientProgram({ clientData });

    return {
      ...clientData,
      physioClientId: clientSnap.id,
      ...(clientProgram && { clientProgram }),
    };
  } catch (error) {
    console.error("Error fetching client:", error, {
      physioId,
      physioClientId,
    });
  }

  return {} as TPhysioClient;
}

// Get all physio clients
export async function getPhysioClients(
  physioId: string
): Promise<TPhysioClient[]> {
  try {
    // Get clients data form physio collection
    const physioRef = doc(db, "physios", physioId);
    const clientsRef = collection(physioRef, "clients");
    const snapshot = await getDocs(
      clientsRef.withConverter(physioClientConverter)
    );

    console.log("snapshot.docs", snapshot.docs);

    // get clients program data from programs subcollection to client.
    const clientsData: TPhysioClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        const clientData: TPhysioClientBase = c.data();
        console.log("clientData", clientData);

        const clientProgram = await _clientProgram({ clientData });
        console.log("clientProgram", clientProgram);

        return {
          ...clientData,
          physioClientId: c.id,
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
      physioId,
    });
    return [];
  }
}
