import {
  doc,
  DocumentReference,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TPhysioProgram, TProgramWrite } from "../../../types/programTypes";
import { programConverter, programDayConverter } from "../../converters";
import { _getProgramFromRef } from "../../programHelpers";

export async function getPhysioProgramWithDays(
  physioId: string,
  physioProgramId: string
): Promise<TPhysioProgram> {
  let programRef = doc(
    db,
    "clinicians",
    physioId,
    "programs",
    physioProgramId
  ) as DocumentReference<TProgramWrite>;

  const physioProgram = await _getProgramFromRef(programRef);

  if (!("physioId" in physioProgram)) {
    throw new Error("Program is not a physio program");
  }

  return physioProgram;
}

export async function getPhysioProgramsWithDays(
  physioId: string
): Promise<TPhysioProgram[]> {
  try {
    const physioRef = doc(db, "clinicians", physioId);
    const programsRef = collection(physioRef, "programs");
    const programsSnap = await getDocs(
      programsRef.withConverter(programConverter)
    );

    // for each program, get the days
    const daysSnap = await Promise.all(
      programsSnap.docs.map((doc) =>
        getDocs(collection(doc.ref, "days").withConverter(programDayConverter))
      )
    );
    // map the days to the programs
    const programs: TPhysioProgram[] = programsSnap.docs.map((doc, i) => {
      const days = Object.fromEntries(
        daysSnap[i].docs.map((doc) => [doc.id, doc.data()])
      );
      return {
        ...doc.data(),
        days,
        physioProgramId: doc.id,
        physioId,
        mode: "continuous",
      };
    });

    return programs;
  } catch (error) {
    console.error("Error fetching physio programs:", error);
    throw error;
  }
}
