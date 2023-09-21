import { DocumentReference, doc } from "firebase/firestore";
import {
  TPhysioProgram,
  TProgramDayRead,
  TProgramDayWrite,
  TProgramRead,
  TProgramWrite,
} from "../types/programTypes";
import { db } from "../firebase/db";
import {
  physioClientConverter,
  programConverter,
  programDayConverter,
} from "./converters";
import { updateDoc } from "./updateDoc";
import { TPhysioClientRead, TPhysioClientWrite } from "../types/physioTypes";

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

export async function updatePhysioClient(
  physioId: string,
  physioClientId: string,
  physioClient: TPhysioClientRead
): Promise<boolean> {
  try {
    const physioClientRef = doc(
      db,
      "physios",
      physioId,
      "clients",
      physioClientId
    ) as DocumentReference<TPhysioClientWrite>;

    const physioClientConverted =
      physioClientConverter.toFirestore(physioClient);

    await updateDoc(physioClientRef, physioClientConverted);

    return true;
  } catch (error) {
    console.error("Error updating physio client: ", error, {
      physioClientId,
      physioId,
      physioClient,
    });
    throw error;
  }
}
