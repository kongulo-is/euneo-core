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

    // get clients program data.
    let clientProgram: TClientProgram | undefined;
    // Get client program data if client has accepted a prescription
    if (clientData.clientId && clientData.prescription?.status === "Accepted") {
      const clientRef = doc(
        db,
        "clients",
        clientData.clientId
      ) as DocumentReference<TClientWrite>;
      const clientSnap = await getDoc(clientRef);
      const currentProgramId = clientSnap.data()!.currentProgramRef?.id || "";
      const clientProgramWithDays = await getClientProgram(
        clientData.clientId,
        currentProgramId
      );
      clientProgram = clientProgramWithDays;
    }

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

    // get clients program data from programs subcollection to client.
    const clientsData: TPhysioClient[] = await Promise.all(
      snapshot.docs.map(async (c) => {
        const clientData: TPhysioClientBase = c.data();
        let clientProgram: TClientProgram | undefined;
        // Get client program data if client has accepted a prescription
        if (
          clientData.clientId &&
          clientData.prescription?.status === "Accepted"
        ) {
          const clientRef = doc(
            db,
            "clients",
            clientData.clientId
          ) as DocumentReference<TClientWrite>;
          const clientSnap = await getDoc(clientRef);
          const currentProgramId =
            clientSnap.data()!.currentProgramRef?.id || "";
          const clientProgramWithDays = await getClientProgram(
            clientData.clientId,
            currentProgramId
          );
          clientProgram = clientProgramWithDays;
        }
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
