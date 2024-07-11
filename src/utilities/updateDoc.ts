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
  TClinicianWrite,
  TClinicianClientWrite,
  TClinicianClientRead,
  TInvitationWrite,
} from "../types/clinicianTypes";
import {
  TProgramWrite,
  TProgramDayWrite,
  TExerciseDayWrite,
  TProgramRead,
  TProgramDayRead,
  TProgramPhaseWrite,
  TProgramVersionWrite,
} from "../types/programTypes";
import { TExercise, TExerciseWrite } from "../types/baseTypes";

type AllWrites =
  | TClientProgramWrite
  | TClientWrite
  | TClientProgramDayWrite
  | TClinicianWrite
  | TClinicianClientWrite
  | TProgramVersionWrite
  | TProgramWrite
  | TProgramDayWrite
  | TExerciseDayWrite
  | TInvitationWrite
  | TProgramPhaseWrite
  | TExerciseWrite;

type AllReads =
  | TClientProgramRead
  | TClient
  | TClientProgramDay
  | TClinicianClientRead
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
