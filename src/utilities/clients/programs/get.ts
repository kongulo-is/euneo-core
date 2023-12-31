import {
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  collection,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClientProgram,
  TClientProgramWrite,
} from "../../../types/clientTypes";
import {
  clientProgramConverter,
  clientProgramDayConverter,
} from "../../converters";
import runtimeChecks from "../../runtimeChecks";

export async function getClientProgram(
  clientId: string,
  clientProgramId: string
): Promise<TClientProgram> {
  try {
    const clientProgramRef = (
      doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgramId
      ) as DocumentReference<TClientProgramWrite>
    ).withConverter(clientProgramConverter);

    const clientProgramSnap = await getDoc(clientProgramRef);

    const clientProgram = clientProgramSnap.data();

    if (!clientProgram) {
      throw new Error("Client program not found");
    }

    // add days to clientProgram
    const daysSnap = await getDocs(
      query(
        collection(clientProgramRef, "days"),
        orderBy("date")
      ).withConverter(clientProgramDayConverter)
    );

    const days = daysSnap.docs.map((doc) => doc.data());

    const clientProgramWithDays: TClientProgram = {
      ...clientProgram,
      clientProgramId: clientProgramId,
      days,
    };

    runtimeChecks.assertTClientProgram(clientProgramWithDays);

    return clientProgramWithDays;
  } catch (error) {
    console.error("Error fetching client program:", error, {
      clientId,
      clientProgramId,
    });
  }
  return {} as TClientProgram;
}
