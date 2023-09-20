import { DocumentReference, doc } from "firebase/firestore";
import {
  TPhysioProgram,
  TProgramDayRead,
  TProgramRead,
} from "../types/programTypes";
import { db } from "../firebase/db";
import { programConverter, programDayConverter } from "./converters";
import { updateDoc } from "./updateDoc";
import { ProgramDayWrite, ProgramWrite } from "../types/converterTypes";

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
    ) as DocumentReference<ProgramWrite>;

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
    ) as DocumentReference<ProgramDayWrite>;
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