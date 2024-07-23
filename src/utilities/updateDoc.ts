import {
  DocumentReference,
  UpdateData,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";

import { TExerciseWrite } from "../types/baseTypes";
import { TExerciseDayWrite } from "../types/programTypes";
import { TProgramVersionWrite } from "../entities/program/version";
import { TProgramWrite } from "../entities/program/program";
import { TClientProgramWrite } from "../entities/client/clientProgram";
import { TClientWrite } from "../entities/client/client";
import { TClientProgramDayWrite } from "../entities/client/day";
import { TProgramDayWrite } from "../entities/program/programDay";
import { TInvitationWrite } from "../types/clinicianTypes";
import { TProgramPhaseWrite } from "../entities/program/programPhase";
import { TClinicianClientWrite } from "../entities/clinician/clinicianClient";
import { TClinicianWrite } from "../entities/clinician/clinician";

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

export function updateDoc<T extends AllWrites>(
  ref: DocumentReference<any, T>,
  data: UpdateData<Partial<T>>,
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
