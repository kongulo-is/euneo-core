import { DocumentReference, doc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClientProgram,
  TClientProgramDayWrite,
  TClientProgramWrite,
} from "../../../types/clientTypes";
import { updateDoc } from "../../updateDoc";
import { TProgram, TProgramPhaseKey } from "../../../types/programTypes";
import { createPhase } from "../../programHelpers";
import { addContinuousDaysToClientProgram } from "./add";

export async function updateProgramDay(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  //TODO: fix type..
  exercises: { iteration: number }[],
  adherence: number
) {
  try {
    const day = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId,
      "days",
      dayId.toString()
    ) as DocumentReference<TClientProgramDayWrite>;

    updateDoc(day, {
      adherence: adherence,
      // TODO: create a converter
      exercises: exercises.map((e) => e.iteration),
    });
  } catch (error) {
    console.error("Error updating program day: ", error, {
      clientId,
      clientProgramId,
      dayId,
      exercises,
      adherence,
    });
    throw error;
  }
}

export async function updateProgramDayDate(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  //TODO: fix type..
  newDate: Date
) {
  try {
    const day = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId,
      "days",
      dayId
    ) as DocumentReference<TClientProgramDayWrite>;

    return await updateDoc(day, {
      date: newDate,
    })
      .then(() => true)
      .catch(() => false);
  } catch (error) {
    console.error("Error updating program day: ", error, {
      clientId,
      clientProgramId,
      dayId,
      newDate,
    });
    throw error;
  }
}

export async function updateProgramFields(
  clientId: string,
  clientProgramId: string,
  fields: Partial<TClientProgramWrite>
) {
  const clientProgramRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;

  return await updateDoc(clientProgramRef, {
    ...fields,
  })
    .then(() => true)
    .catch(() => false);
}

export async function completeProgram(
  clientId: string,
  clientProgramId: string
) {
  const clientProgramRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;

  return await updateDoc(clientProgramRef, {
    completed: true,
  })
    .then(() => true)
    .catch(() => false);
}

// function that changes the phase a client is in
export async function changeClientPhase(
  clientProgram: TClientProgram,
  clientId: string,
  program: TProgram,
  newPhase: TProgramPhaseKey
) {
  // start by removing the current day and future days from the client's program
  const { days, trainingDays } = clientProgram;
  // filter the days to only include days that are before the current day and count them
  const daysBeforeCurrent = days.filter((day) => day.date < new Date());
  const lastDay = daysBeforeCurrent[daysBeforeCurrent.length - 1];

  const numDaysFiltered = days.length - daysBeforeCurrent.length;

  // find the current day index in the client program
  const currDayIndex = days.findIndex((day) => day.date === lastDay.date);

  // call the function  that adds a continuous phase to client
  const newDays = createPhase(
    trainingDays,
    program,
    newPhase,
    new Date(),
    14,
    currDayIndex + 1
  );
  addContinuousDaysToClientProgram(
    clientId,
    clientProgram.clientProgramId,
    newDays,
    currDayIndex
  );

  // then update the phases map property of the client's program so that it is correct

  const updatedPhases = [...clientProgram.phases];
  const currentPhase = updatedPhases[updatedPhases.length - 1];

  if (currentPhase.value - 1 - numDaysFiltered === 0) {
    updatedPhases.pop();
  } else if (numDaysFiltered > 0) {
    updatedPhases[updatedPhases.length - 1] = {
      ...currentPhase,
      value: currentPhase.value - 1 - numDaysFiltered,
    };
  }

  updatedPhases.push({
    key: newPhase,
    value: newDays.length,
  });

  updateProgramFields(clientId, clientProgram.clientProgramId, {
    phases: updatedPhases,
  });
}
