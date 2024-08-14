import { doc, setDoc } from "firebase/firestore";

import { createPhase } from "../../programHelpers";
import {
  TClinicianProgram,
  TEuneoProgram,
} from "../../../entities/program/program";
import { TProgramPhaseKey } from "../../../entities/program/programPhase";
import {
  clientProgramDayConverter,
  createClientProgramDayRef,
  TClientProgramDay,
} from "../../../entities/client/day";
import {
  createClientProgramRef,
  deserializeClientProgramPath,
  TClientProgram_Clinician,
  TClientProgram_ClinicianWithPrescription_Read,
  TClientProgram_Euneo,
  TClientProgram_Euneo_Read,
  TClientProgramRef,
} from "../../../entities/client/clientProgram";
import { createClientRef } from "../../../entities/client/client";
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
 * @description TODO: add description here what does this mean? how do I use it?
 * This function is used in app
 */
export async function addClinicianProgramToClient(
  clientId: string,
  clientProgramRead: TClientProgram_ClinicianWithPrescription_Read,
  program: TClinicianProgram,
  startPhase: TProgramPhaseKey = "p1"
): Promise<TClientProgram_Clinician> {
  // Store the program in the Firestore database
  const clientProgramRef = createClientProgramRef({
    clients: clientId,
  });

  await setDoc(clientProgramRef, clientProgramRead);
  const { trainingDays } = clientProgramRead;
  const clientProgramDays = createPhase(
    trainingDays,
    program,
    startPhase,
    new Date(),
    program.phases[startPhase].length || 14
  );

  const clientClinicianProgram: TClientProgram_Clinician = {
    ...clientProgramRead,
    days: clientProgramDays,
    clientProgramRef: clientProgramRef,
    clientProgramIdentifiers: deserializeClientProgramPath(
      clientProgramRef.path
    ),
  };

  await Promise.all(
    clientProgramDays.map((day, i) => {
      const dayRef = createClientProgramDayRef({
        clients: clientId,
        programs: clientClinicianProgram.clientProgramIdentifiers.programs,
        days: i.toString(),
      });

      return setDoc(dayRef, day);
    })
  );

  const clientRef = createClientRef({
    clients: clientId,
  });

  updateDoc(clientRef, { currentClientProgramRef: clientProgramRef });

  return clientClinicianProgram;
}

/**
 * @description TODO: add description here what does this mean? how do I use it? Who uses it?
 * @returns
 */
export async function addEuneoProgramToClient(
  clientId: string,
  clientProgramRead: TClientProgram_Euneo_Read,
  program: TEuneoProgram,
  phaseId: TProgramPhaseKey
): Promise<TClientProgram_Euneo> {
  const { trainingDays, phases } = clientProgramRead;

  // const currentPhase = program.phases[phaseId];
  const phaseLength = phases[phases.length - 1].value;

  const clientProgramDays: TClientProgramDay[] = createPhase(
    trainingDays,
    program,
    phaseId,
    new Date(),
    phaseLength
  );

  const clientProgramRef = createClientProgramRef({
    clients: clientId,
  });

  await setDoc(clientProgramRef, clientProgramRead);

  let d = new Date();
  d.setHours(0, 0, 0, 0);

  const clientEuenoProgram: TClientProgram_Euneo = {
    ...clientProgramRead,
    days: clientProgramDays,
    clientProgramRef: clientProgramRef,
    clientProgramIdentifiers: deserializeClientProgramPath(
      clientProgramRef.path
    ),
  };

  await Promise.all(
    clientProgramDays.map((day, i) => {
      // TODO: move this to a function inside days folder? this is also used in the function above
      console.log("Day", day, i);

      const dayRef = createClientProgramDayRef({
        clients: clientId,
        programs: clientEuenoProgram.clientProgramIdentifiers.programs,
        days: i.toString(),
      });

      console.log("dayRef", dayRef.path);

      return setDoc(dayRef, day);
    })
  );

  const clientRef = createClientRef({
    clients: clientId,
  });

  updateDoc(clientRef, { currentClientProgramRef: clientProgramRef });

  return clientEuenoProgram;
}

// The context mapper should get data from the asyncs storage and set it to the context
export async function addOutcomeMeasureToClientProgram(
  clientId: string,
  clientProgramId: string,
  outcomeMeasuresAnswers: Record<TOutcomeMeasureId, TOutcomeMeasureAnswers[]>,
  newData: Record<Partial<TOutcomeMeasureId>, TOutcomeMeasureAnswers>
) {
  try {
    const clientProgramRef = createClientProgramRef({
      clients: clientId,
      programs: clientProgramId,
    });

    const newOutcomeMeasuresAnswers = { ...outcomeMeasuresAnswers };
    Object.entries(newData).forEach(([key, answers]) => {
      const measureId = key as TOutcomeMeasureId;
      const oldMeasureAnswers = outcomeMeasuresAnswers[measureId];
      if (oldMeasureAnswers) {
        newOutcomeMeasuresAnswers[measureId] = [...oldMeasureAnswers, answers];
      } else {
        newOutcomeMeasuresAnswers[measureId] = [answers];
      }
    });

    // Update the user's painLevel array in firestore
    await updateDoc(clientProgramRef, {
      outcomeMeasuresAnswers: newOutcomeMeasuresAnswers,
    });

    return true;
  } catch (error) {
    console.log(error);

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
