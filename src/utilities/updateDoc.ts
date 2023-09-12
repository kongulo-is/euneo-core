import {
  DocumentReference,
  UpdateData,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";

import {
  ClientProgramDayWrite,
  ClientProgramWrite,
  ClientWrite,
  EuneoProgramWrite,
  ExerciseDayWrite,
  PhysioClientWrite,
  PhysioProgramWrite,
  PhysioWrite,
  ProgramDayWrite,
} from "@src/types/converterTypes";
type AllWrites =
  | ClientProgramWrite
  | ClientWrite
  | ClientProgramDayWrite
  | PhysioWrite
  | PhysioClientWrite
  | EuneoProgramWrite
  | PhysioProgramWrite
  | ProgramDayWrite
  | ExerciseDayWrite;

export function updateDoc<T extends AllWrites>(
  ref: DocumentReference<T, any>,
  data: UpdateData<Partial<T>>
) {
  return firestoreUpdateDoc(ref, data);
}

// DEMO
// const clientRef = doc(
//   db,
//   "clients",
//   "jfdkljal"
// ) as DocumentReference<ClientWrite>;

// // Type-safe for ClientProgramWrite
// updateDoc(clientRef, {
//   currentProgramId: "hdjskafhakjf",
// });

// const clientRe = doc(db, "clients", "jfdkljal") as DocumentReference<ClientProgramDayWrite>;

// // Type-safe for ClientProgramWrite
// updateDoc(clientRe, {  dayId: "jfkldsaj" });
