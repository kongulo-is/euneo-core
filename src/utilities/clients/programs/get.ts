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
  Timestamp,
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
import { TOutcomeMeasureId } from "../../../types/clinicianTypes";

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
  maxNumberOfDays?: number,
  skipMaintenanceData?: boolean
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

    const { painLevels, outcomeMeasuresAnswers } = clientProgram;

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

    const clientProgramWithDays: TClientProgram = {
      ...clientProgram,
      clientProgramId: clientProgramId,
      days: filteredDays,
      painLevels: filteredPainLevels,
      outcomeMeasuresAnswers: filteredOutcomeMeasureAnswers,
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
