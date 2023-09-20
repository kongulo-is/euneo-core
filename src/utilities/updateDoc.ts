import {
  DocumentReference,
  UpdateData,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";
import {
  TClientProgramDayWrite,
  TClientProgramWrite,
  TClientWrite,
} from "../types/clientTypes";
import { TPhysioWrite, TPhysioClientWrite } from "../types/physioTypes";
import {
  TProgramWrite,
  TProgramDayWrite,
  TExerciseDayWrite,
} from "../types/programTypes";

type AllWrites =
  | TClientProgramWrite
  | TClientWrite
  | TClientProgramDayWrite
  | TPhysioWrite
  | TPhysioClientWrite
  | TProgramWrite
  | TProgramDayWrite
  | TExerciseDayWrite;

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
