import { DocumentReference, deleteField, doc } from "firebase/firestore";
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

export async function removeRefetchFromProgram(
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
    shouldRefetch: deleteField(),
  })
    .then(() => true)
    .catch((err) => {
      console.log("Error: ", err);
      return false;
    });
}

// function that changes the phase a client is in
export async function changeClientPhase(
  clientProgram: TClientProgram,
  clientId: string,
  program: TProgram,
  newPhase: TProgramPhaseKey,
  currentPhaseId: TProgramPhaseKey
) {
  console.log("currentPhaseId", currentPhaseId);
  console.log("newPhase", newPhase);
  // start by removing the current day and future days from the client's program
  const { days, trainingDays } = clientProgram;
  console.log("days", days);
  // filter the days to only include days that are before the current day in current phase and count them
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysBeforeCurrent = days.filter(
    (day) =>
      day.date.getTime() < today.getTime() && day.phaseId === currentPhaseId
  );

  console.log("today", today);

  // const numDaysFiltered = days.length - daysBeforeCurrent.length;
  console.log("days length", days.length);
  console.log("daysBeforeCurrent length", daysBeforeCurrent.length);

  // find the current day index in the client program
  const currDayIndex =
    days.findIndex((day) => day.date.getTime() === today.getTime()) || 0;
  console.log("currDayIndex", currDayIndex);

  const phaseLength = days.length - currDayIndex;
  console.log("phaseLength", phaseLength);

  // call the function  that adds a continuous phase to client
  const newDays = createPhase(
    trainingDays,
    program,
    newPhase,
    new Date(),
    phaseLength,
    0 // on start of new phase, start at day 0
  );
  console.log("newDays", newDays);

  addContinuousDaysToClientProgram(
    clientId,
    clientProgram.clientProgramId,
    newDays,
    currDayIndex
  );

  // then update the phases map property of the client's program so that it is correct

  const updatedPhases = [...clientProgram.phases];
  console.log("updatedPhases", updatedPhases);

  const currentPhase = updatedPhases[updatedPhases.length - 1];

  if (daysBeforeCurrent.length === 0) {
    updatedPhases.pop();
  } else if (daysBeforeCurrent.length > 0) {
    updatedPhases[updatedPhases.length - 1] = {
      ...currentPhase,
      value: daysBeforeCurrent.length,
    };
  }

  updatedPhases.push({
    key: newPhase,
    value: newDays.length,
  });

  console.log("updatedPhases after push:", updatedPhases);

  updateProgramFields(clientId, clientProgram.clientProgramId, {
    phases: updatedPhases,
    shouldRefetch: true,
  });
}
