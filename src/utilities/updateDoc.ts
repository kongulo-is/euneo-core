import {
  DocumentReference,
  UpdateData,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";
import {
  TClient,
  TClientProgramDay,
  TClientProgramDayWrite,
  TClientProgramRead,
  TClientProgramWrite,
  TClientWrite,
} from "../types/clientTypes";
import {
  TPhysioWrite,
  TPhysioClientWrite,
  TPhysioClientRead,
} from "../types/physioTypes";
import {
  TProgramWrite,
  TProgramDayWrite,
  TExerciseDayWrite,
  TProgramRead,
  TProgramDayRead,
} from "../types/programTypes";
import { TExercise } from "../types/baseTypes";

type AllWrites =
  | TClientProgramWrite
  | TClientWrite
  | TClientProgramDayWrite
  | TPhysioWrite
  | TPhysioClientWrite
  | TProgramWrite
  | TProgramDayWrite
  | TExerciseDayWrite;

type AllReads =
  | TClientProgramRead
  | TClient
  | TClientProgramDay
  | TPhysioClientRead
  | TProgramRead
  | TProgramDayRead
  | TExercise;

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
