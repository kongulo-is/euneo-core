import {
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  collection,
  orderBy,
  CollectionReference,
  where,
  limit,
  QueryConstraint,
  limitToLast,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClientProgram,
  TClientProgramBase,
  TClientProgramWrite,
} from "../../../types/clientTypes";
import {
  clientProgramConverter,
  clientProgramDayConverter,
  oldClientProgramConverter,
  oldClientProgramDayConverter,
} from "../../converters";
import runtimeChecks from "../../runtimeChecks";

export async function getClientProgramsForUpdate(
  clientId: string
): Promise<
  (TClientProgramWrite & { clientProgramId: string; clientId: string })[]
> {
  try {
    const clientProgramsRef = collection(
      db,
      "clients",
      clientId,
      "programs"
    ) as CollectionReference<TClientProgramWrite>;

    const clientProgramsSnap = await getDocs(clientProgramsRef);

    const clientPrograms = clientProgramsSnap.docs.map((doc) => {
      const clientProgramWrite = doc.data();
      return {
        ...clientProgramWrite,
        clientProgramId: doc.id,
        clientId: clientId,
      };
    });

    const filteredClientPrograms = clientPrograms.filter(
      (program) => !program.clinicianClientRef
    );

    return filteredClientPrograms;
  } catch (error) {
    console.error("Error fetching client programs:", error, { clientId });
  }
  return [] as (TClientProgramWrite & {
    clientProgramId: string;
    clientId: string;
  })[];
}

export async function getClientProgram(
  clientId: string,
  clientProgramId: string,
  maxNumberOfDays?: number
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
    const queryConstraints: QueryConstraint[] = [orderBy("date")];

    if (maxNumberOfDays) {
      queryConstraints.push(limitToLast(maxNumberOfDays));
    }

    const daysSnap = await getDocs(
      query(
        collection(clientProgramRef, "days"),
        ...queryConstraints
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

// TODO: Functions for deprecated programs
export async function getDeprecatedClientProgram(
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
    ).withConverter(oldClientProgramConverter);

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
      ).withConverter(oldClientProgramDayConverter)
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
