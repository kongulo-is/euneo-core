import { doc, DocumentReference, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TProgramRead,
  TProgramDayRead,
  TPhysioProgram,
  TProgramWrite,
  TProgramDayWrite,
} from "../../../types/programTypes";
import { programConverter, programDayConverter } from "../../converters";

export async function updatePhysioProgram(
  physioProgram: TProgramRead,
  days: Record<`d${number}`, TProgramDayRead>,
  physioProgramId: string,
  physioId: string
): Promise<TPhysioProgram> {
  try {
    const programRef = doc(
      db,
      "physios",
      physioId,
      "programs",
      physioProgramId
    ) as DocumentReference<TProgramWrite>;

    // convert and update program.
    const programConverted = programConverter.toFirestore(physioProgram);
    await updateDoc(programRef, programConverted);

    // convert and update program days.
    const day = programDayConverter.toFirestore(days["d1"]);
    const dayRef = doc(
      db,
      "physios",
      physioId,
      "programs",
      physioProgramId,
      "days",
      "d1"
    ) as DocumentReference<TProgramDayWrite>;
    await updateDoc(dayRef, day);

    return {
      ...physioProgram,
      mode: "continuous",
      days,
      physioProgramId,
      physioId,
    };
  } catch (error) {
    console.error(
      "Error updating physio program: ",
      error,
      physioProgram,
      days,
      physioProgramId,
      physioId
    );
  }
  throw new Error("Error updating physio program");
}
