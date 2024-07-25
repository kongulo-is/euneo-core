import {
  DocumentReference,
  getDoc,
  getDocs,
  query,
  collection,
  orderBy,
  where,
  QueryConstraint,
  limitToLast,
  Timestamp,
} from "firebase/firestore";

import {
  deserializeClientProgramPath,
  TClientProgram,
  TClientProgramRead,
  TClientProgramWrite,
} from "../../../entities/client/clientProgram";
import { clientProgramDayConverter } from "../../../entities/client/day";
import { TOutcomeMeasureId } from "../../../entities/outcomeMeasure/outcomeMeasure";

export async function getClientProgram(
  clientProgramRef: DocumentReference<TClientProgramRead, TClientProgramWrite>,
  maxNumberOfDays?: number,
  skipMaintenanceData?: boolean
): Promise<TClientProgram> {
  try {
    const clientProgramSnap = await getDoc(clientProgramRef);

    const clientProgramRead = clientProgramSnap.data();

    if (!clientProgramRead) {
      throw new Error("Client program not found");
    }

    // add days to clientProgram
    const queryConstraints: QueryConstraint[] = [orderBy("date")];

    // if maxNumberOfDays is defined, limit the number of days to maxNumberOfDays
    if (maxNumberOfDays) {
      queryConstraints.push(limitToLast(maxNumberOfDays));
      // Get today's date and time at the end of the day
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Add a where condition to only get documents with a date before or equal to today
      queryConstraints.push(where("date", "<=", Timestamp.fromDate(today)));
    }

    const daysSnap = await getDocs(
      query(
        collection(clientProgramRef, "days"),
        ...queryConstraints
      ).withConverter(clientProgramDayConverter)
    );

    const days = daysSnap.docs.map((doc) => doc.data());

    const firstMaintenancePhaseDay = days.find((d) => d.phaseId.includes("m"));

    const { painLevels, outcomeMeasuresAnswers } = clientProgramRead;

    let filteredDays = [...days];
    let filteredPainLevels = [...painLevels];
    let filteredOutcomeMeasureAnswers = outcomeMeasuresAnswers
      ? { ...outcomeMeasuresAnswers }
      : null;

    // Filter out maintenance phase data if skipMaintenanceData is true and there is any maintenance phase data
    if (skipMaintenanceData && firstMaintenancePhaseDay) {
      filteredDays = days.filter((d) => d.date < firstMaintenancePhaseDay.date);
      filteredPainLevels = painLevels.filter(
        (p) => p.date < firstMaintenancePhaseDay.date
      );
      if (filteredOutcomeMeasureAnswers) {
        for (const key in outcomeMeasuresAnswers) {
          const outcomeMeasureId = key as TOutcomeMeasureId;
          filteredOutcomeMeasureAnswers[outcomeMeasureId] =
            outcomeMeasuresAnswers[outcomeMeasureId].filter(
              (a) => a.date < firstMaintenancePhaseDay.date
            );
        }
      }
    }

    const clientProgram: TClientProgram = {
      ...clientProgramRead,
      days: filteredDays,
      painLevels: filteredPainLevels,
      outcomeMeasuresAnswers: filteredOutcomeMeasureAnswers,
      clientProgramRef: clientProgramRef,
      clientProgramIdentifiers: deserializeClientProgramPath(
        clientProgramRef.path
      ),
    };

    console.log("clientProgramWithDays", clientProgram);

    return clientProgram;
  } catch (error) {
    console.error("Error fetching client program:", error, clientProgramRef);
  }
  return {} as TClientProgram;
}

export async function getClientPrograms(clientId: string) {
  try {
    const clientProgramsRef = collection(
      db,
      "clients",
      clientId,
      "programs"
    ) as CollectionReference<TClientProgramWrite>;

    const clientProgramsSnap = await getDocs(
      clientProgramsRef.withConverter(clientProgramConverter)
    );

    const clientPrograms = clientProgramsSnap.docs.map((c) => {
      const clientProgramRead = c.data();
      return { ...clientProgramRead, clientProgramId: c.id };
    });

    return clientPrograms;
  } catch (error) {
    console.error("Error fetching client programs:", error);
  }
}
