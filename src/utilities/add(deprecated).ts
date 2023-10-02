/** @deprecated  */

import {
  collection,
  addDoc,
  doc,
  setDoc,
  DocumentReference,
  updateDoc,
  CollectionReference,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/db";
import {
  TClientEuneoProgram,
  TClientEuneoProgramRead,
  TClientPhysioProgram,
  TClientPhysioProgramRead,
  TClientProgramDay,
  TClientWrite,
} from "../types/clientTypes";
import {
  TEuneoProgram,
  TPhaseProgram,
  TProgramDay,
} from "../types/programTypes";
import {
  clientProgramConverter,
  clientProgramDayConverter,
  prescriptionConverter,
} from "./converters";
import {
  TPhysioClientWrite,
  TPrescription,
  TPrescriptionWrite,
} from "../types/physioTypes";

// Overloads
// export function addProgramToClient(
//   clientId: string,
//   clientProgram: TClientEuneoProgramRead,
//   days: { [key: string]: TProgramDay }
// ): Promise<TClientEuneoProgram>;
// export function addProgramToClient(
//   clientId: string,
//   clientProgram: TClientPhysioProgramRead,
//   days: { [key: string]: TProgramDay }
// ): Promise<TClientPhysioProgram>;
// // Implementation
// export async function addProgramToClient(
//   clientId: string,
//   clientProgram: TClientEuneoProgramRead | TClientPhysioProgramRead,
//   days: { [key: string]: TProgramDay }
// ): Promise<TClientProgram> {
//   if ("euneoProgramId" in clientProgram) {
//     return clientProgram;
//   } else {
//     const clientPhysioProgram = await addPhysioProgramToClient(
//       clientId,
//       clientProgram,
//       days
//     );
//     return clientPhysioProgram;
//   }
// }

// Usage
// const euneoProgramProps: {
//   clientId: string;
//   clientProgram: TClientEuneoProgram;
//   days: any;
// } = {
//   clientId: "client1",
//   clientProgram: {
//     conditionId: "plantar-heel-pain",
//     euneoProgramId: "euneo1",
//     outcomeMeasuresAnswers: [] as TOutcomeMeasureAnswers[],
//     painLevels: [] as TPainLevel[],
//     physicalInformation: {
//       athlete: false,
//       height: 0,
//       weight: 0,
//       unit: "metric",
//       physicalActivity: "None",
//     },
//     trainingDays: [] as boolean[],
//     conditionAssessmentAnswers: [] as Array<boolean | string>,
//   },
//   days: {},
// };

// const physioProgramProps: {
//   clientId: string;
//   clientProgram: TClientPhysioProgram;
//   days: any;
// } = {
//   clientId: "client2",
//   clientProgram: {
//     conditionId: "plantar-heel-pain",
//     physioProgramId: "physio1",
//     physioId: "physio2",
//     outcomeMeasuresAnswers: [],
//     painLevels: [],
//     physicalInformation: {
//       athlete: false,
//       height: 0,
//       weight: 0,
//       unit: "metric",
//       physicalActivity: "None",
//     },
//     trainingDays: [],
//     conditionAssessmentAnswers: [],
//   },
//   days: {},
// };

// const euneoResult = addProgramToClient(
//   euneoProgramProps.clientId,
//   euneoProgramProps.clientProgram,
//   euneoProgramProps.days
// );
// const physioResult = addProgramToClient(
//   physioProgramProps.clientId,
//   physioProgramProps.clientProgram,
//   physioProgramProps.days
// );
