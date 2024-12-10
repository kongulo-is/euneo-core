import { arrayUnion, doc, DocumentReference, setDoc } from "firebase/firestore";

import { createPhase } from "../../programHelpers";
import { TProgram } from "../../../entities/program/program";
import {
  getTrainingDaysForPhase,
  TProgramPhaseKey,
} from "../../../entities/program/programPhase";
import {
  clientProgramDayConverter,
  createClientProgramDayRef,
  TClientProgramDay,
} from "../../../entities/client/day";
import {
  createClientProgramRef,
  deserializeClientProgramPath,
  TClientProgram,
  TClientProgramRead,
  TClientProgramRef,
  TClientProgramWrite,
} from "../../../entities/client/clientProgram";
import { TClientRead, TClientWrite } from "../../../entities/client/client";
import { TOutcomeMeasureId } from "../../../entities/outcomeMeasure/outcomeMeasure";
import { TOutcomeMeasureAnswers } from "../../../entities/client/outcomeMeasureAnswer";
import { TPainLevel } from "../../../entities/client/painLevel";
import { TPhase } from "../../../entities/client/phase";
import { updateDoc } from "../../updateDoc";

/**
 * @description used in app? //TODO: add description here what does this mean? how do I use it?
 */
async function _addDaysToFirestore(
  clientProgramRef: TClientProgramRef,
  days: TClientProgramDay[],
  firstDocIndex: number
) {
  // Update days documents
  await Promise.all(
    days.map((day, i) => {
      const dayNumber = i + firstDocIndex;
      const dayCol = doc(clientProgramRef, "days", dayNumber.toString());
      return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
    })
  );
}

/**
 * @description Function used to create a client program.
 * This function is only used in the app for now.
 */
export async function addProgramToClient(
  clientRef: DocumentReference<TClientRead, TClientWrite>,
  clientProgramRef: DocumentReference<TClientProgramRead, TClientProgramWrite>,
  clientProgramRead: TClientProgramRead,
  program: TProgram
): Promise<TClientProgram> {
  const { trainingDays: selectedTrainingDays, phases } = clientProgramRead;
  // Destructure first phase object
  const startPhase = phases[phases.length - 1];
  const startPhaseId = startPhase.key as TProgramPhaseKey;
  const startPhaseLength = startPhase.value;
  // Handle case where the program phase can be acute (rest days disabled)
  const phaseTrainingDays = getTrainingDaysForPhase(
    program.phases[startPhaseId],
    selectedTrainingDays
  );
  // Create the client program days
  const clientProgramDays = createPhase(
    phaseTrainingDays,
    program,
    startPhaseId,
    new Date(),
    startPhaseLength
  );
  // Store the client program in the Firestore database
  await setDoc(clientProgramRef, clientProgramRead);

  const clientProgram: TClientProgram = {
    ...clientProgramRead,
    days: clientProgramDays,
    clientProgramRef: clientProgramRef,
    clientProgramIdentifiers: deserializeClientProgramPath(
      clientProgramRef.path
    ),
  };
  // Add client program days to it's sub collection
  await Promise.all(
    clientProgramDays.map((day, i) => {
      const dayRef = createClientProgramDayRef({
        clients: clientRef.id,
        programs: clientProgram.clientProgramIdentifiers.programs,
        days: i.toString(),
      });

      return setDoc(dayRef, day);
    })
  );

  // Update client's current program field in firebase
  updateDoc(clientRef, { currentClientProgramRef: clientProgramRef });

  return clientProgram;
}

// /**
//  * @description TODO: add description here what does this mean? how do I use it?
//  * This function is used in app
//  */
// export async function addClinicianProgramToClient(
//   clientId: string,
//   clientProgramRead: TClientProgram_ClinicianWithPrescription_Read,
//   program: TClinicianProgram,
//   startPhaseId: TProgramPhaseKey = "p1"
// ): Promise<TClientProgram_Clinician> {
//   // Store the program in the Firestore database
//   const clientProgramRef = createClientProgramRef({
//     clients: clientId,
//   });

//   await setDoc(clientProgramRef, clientProgramRead);
//   const { trainingDays: selectedTrainingDays } = clientProgramRead;

//   const phaseTrainingDays = getTrainingDaysForPhase(
//     program.phases[startPhaseId],
//     selectedTrainingDays
//   );

//   const clientProgramDays = createPhase(
//     phaseTrainingDays,
//     program,
//     startPhaseId,
//     new Date(),
//     program.phases[startPhaseId].length || 14
//   );

//   const clientClinicianProgram: TClientProgram_Clinician = {
//     ...clientProgramRead,
//     days: clientProgramDays,
//     clientProgramRef: clientProgramRef,
//     clientProgramIdentifiers: deserializeClientProgramPath(
//       clientProgramRef.path
//     ),
//   };

//   await Promise.all(
//     clientProgramDays.map((day, i) => {
//       const dayRef = createClientProgramDayRef({
//         clients: clientId,
//         programs: clientClinicianProgram.clientProgramIdentifiers.programs,
//         days: i.toString(),
//       });

//       return setDoc(dayRef, day);
//     })
//   );

//   const clientRef = createClientRef({
//     clients: clientId,
//   });

//   updateDoc(clientRef, { currentClientProgramRef: clientProgramRef });

//   return clientClinicianProgram;
// }

// /**
//  * @description TODO: add description here what does this mean? how do I use it? Who uses it?
//  * @returns
//  */
// export async function addEuneoProgramToClient(
//   clientId: string,
//   clientProgramRead: TClientProgram_Euneo_Read,
//   program: TEuneoProgram,
//   phaseId: TProgramPhaseKey,
//   startDay: Date = new Date()
// ): Promise<TClientProgram_Euneo> {
//   const { trainingDays: selectedTrainingDays, phases } = clientProgramRead;

//   console.log("Initial euneo phase: ", program.phases[phaseId]);

//   const phaseTrainingDays = getTrainingDaysForPhase(
//     program.phases[phaseId],
//     selectedTrainingDays
//   );

//   console.log("Phase training days: ", phaseTrainingDays);

//   // const currentPhase = program.phases[phaseId];
//   const phaseLength = phases[phases.length - 1].value;

//   const clientProgramDays: TClientProgramDay[] = createPhase(
//     phaseTrainingDays,
//     program,
//     phaseId,
//     startDay,
//     phaseLength
//   );

//   const clientProgramRef = createClientProgramRef({
//     clients: clientId,
//   });

//   await setDoc(clientProgramRef, clientProgramRead);

//   const clientEuenoProgram: TClientProgram_Euneo = {
//     ...clientProgramRead,
//     days: clientProgramDays,
//     clientProgramRef: clientProgramRef,
//     clientProgramIdentifiers: deserializeClientProgramPath(
//       clientProgramRef.path
//     ),
//   };

//   await Promise.all(
//     clientProgramDays.map((day, i) => {
//       // TODO: move this to a function inside days folder? this is also used in the function above
//       const dayRef = createClientProgramDayRef({
//         clients: clientId,
//         programs: clientEuenoProgram.clientProgramIdentifiers.programs,
//         days: i.toString(),
//       });

//       return setDoc(dayRef, day);
//     })
//   );

//   const clientRef = createClientRef({
//     clients: clientId,
//   });

//   updateDoc(clientRef, { currentClientProgramRef: clientProgramRef });

//   return clientEuenoProgram;
// }

// The context mapper should get data from the asyncs storage and set it to the context
export async function addOutcomeMeasureToClientProgram(
  clientId: string,
  clientProgramId: string,
  newOutcomeMeasure: TOutcomeMeasureAnswers
) {
  try {
    // Ensure newOutcomeMeasure is defined and has the necessary fields
    if (!newOutcomeMeasure || !newOutcomeMeasure.outcomeMeasureId) {
      throw new Error("Invalid outcome measure: Missing necessary fields.");
    }

    const clientProgramRef = createClientProgramRef({
      clients: clientId,
      programs: clientProgramId,
    });

    // Using Firestore's FieldValue.arrayUnion() to append new outcome measure
    const res = await updateDoc(clientProgramRef, {
      [`outcomeMeasuresAnswers.${newOutcomeMeasure.outcomeMeasureId}`]:
        arrayUnion(newOutcomeMeasure), // Append the new outcome measure
    });

    return true;
  } catch (error) {
    console.error("Error adding outcome measure to client program:", error);

    return false;
  }
}
export async function addPainLevelToClientProgram(
  clientId: string,
  clientProgramId: string,
  oldPainLevels: TPainLevel[],
  newPainLevel: TPainLevel
) {
  try {
    const clientProgramRef = createClientProgramRef({
      clients: clientId,
      programs: clientProgramId,
    });

    const newPainLevels = [...oldPainLevels, newPainLevel];

    // Update the user's painLevel array in firestore
    await updateDoc(clientProgramRef, {
      painLevels: newPainLevels,
    });

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
}

export async function addPhaseToClientProgram(
  clientId: string,
  clientProgramId: string,
  newPhase: TClientProgramDay[],
  programPhases: TPhase[],
  firstDocIndex: number
) {
  const clientProgramRef = createClientProgramRef({
    clients: clientId,
    programs: clientProgramId,
  });

  await _addDaysToFirestore(clientProgramRef, newPhase, firstDocIndex);

  await updateDoc(clientProgramRef, {
    phases: programPhases,
  });
}

export async function addContinuousDaysToClientProgram(
  clientProgramRef: TClientProgramRef,
  newDays: TClientProgramDay[],
  firstDocIndex: number
) {
  await _addDaysToFirestore(clientProgramRef, newDays, firstDocIndex);
}

/**
 * @description Function that updates training days selection and future days on the client program in firestore
 * @param clientId Id of the client
 * @param clientProgramId Id of the client program
 * @param newDays Updated days based on the newly selected training days
 * @param trainingDays Array of booleans indicating which days are training days
 * @param firstDocIndex What day index we starting modifying from
 */
export async function updateTrainingDays(
  clientId: string,
  clientProgramId: string,
  newDays: TClientProgramDay[],
  trainingDays: boolean[],
  firstDocIndex: number
) {
  const clientProgramRef = createClientProgramRef({
    clients: clientId,
    programs: clientProgramId,
  });

  // Update training days
  await updateDoc(clientProgramRef, {
    trainingDays: trainingDays,
  });

  await _addDaysToFirestore(clientProgramRef, newDays, firstDocIndex);
}
