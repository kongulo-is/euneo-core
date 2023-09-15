import {
  DocumentReference,
  UpdateData,
  updateDoc as firestoreUpdateDoc,
  addDoc as firestoreAddDoc,
  CollectionReference,
} from "firebase/firestore";
import {
  ClientProgramWrite,
  ClientWrite,
  ClientProgramDayWrite,
  PhysioWrite,
  PhysioClientWrite,
  EuneoProgramWrite,
  PhysioProgramWrite,
  ProgramDayWrite,
  ExerciseDayWrite,
} from "../types/converterTypes";

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
