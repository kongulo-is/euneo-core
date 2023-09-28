import { DocumentReference, doc, setDoc } from "firebase/firestore";
import { TEuneoProgram, TPhaseProgram } from "../../types/programTypes";
import { db } from "../../firebase/db";
import { updateDoc } from "../updateDoc";
import { clientProgramDayConverter } from "../converters";
import {
  TClientProgramDay,
  TClientProgramWrite,
  TPhase,
} from "../../types/clientTypes";

export async function addPhaseToClientProgram(
  clientId: string,
  clientProgramId: string,
  newPhase: TClientProgramDay[],
  programPhases: TPhase[],
  firstDocIndex: number
) {
  await Promise.all(
    newPhase.map((day, i) => {
      const dayNumber = i + firstDocIndex;
      const dayCol = doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgramId,
        "days",
        dayNumber.toString()
      );
      return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
    })
  );
  console.log("Updating client doc...");

  const programRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;

  await updateDoc(programRef, {
    phases: programPhases,
  });

  console.log("AddNewPhase func finished!!!");
}

export async function addContinuousDaysToClientProgram(
  trainingDays: boolean[],
  program: TEuneoProgram & TPhaseProgram,
  startDayIndex: number
) {}

export async function updateTrainingDays(
  clientId: string,
  clientProgramId: string,
  newDays: TClientProgramDay[],
  trainingDays: boolean[],
  firstDocIndex: number
) {
  const programRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;
  // Update training days
  await updateDoc(programRef, {
    trainingDays: trainingDays,
  });
  // Update days documents
  await Promise.all(
    newDays.map((day, i) => {
      const dayNumber = i + firstDocIndex;
      const dayCol = doc(programRef, "days", dayNumber.toString());
      return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
    })
  );
}
