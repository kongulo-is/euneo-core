import { DocumentReference, deleteField } from "firebase/firestore";
import { updateDoc } from "../../updateDoc";
import { createPhase } from "../../programHelpers";
import { addContinuousDaysToClientProgram } from "./add";
import { removeDaysFromClientProgram } from "./delete";
import {
  TProgramFinitePhaseRead,
  TProgramPhase,
  TProgramPhaseKey,
} from "../../../entities/program/programPhase";
import { TClinicianProgram, TProgram } from "../../../entities/program/program";
import {
  createClientProgramDayRef,
  TClientProgramDay,
} from "../../../entities/client/day";
import {
  createClinicianClientRef,
  TClinicianClientRef,
} from "../../../entities/clinician/clinicianClient";
import { TPhase } from "../../../entities/client/phase";
import {
  createClientProgramRef,
  TClientProgram,
  TClientProgramRead,
  TClientProgramRef,
  TClientProgramWrite,
} from "../../../entities/client/clientProgram";
import {
  createProgramVersionRef,
  TProgramVersionRead,
  TProgramVersionRef,
  TProgramVersionWrite,
} from "../../../entities/program/version";
import { daysBetweenDates, isDateInPast, isToday } from "../../basicHelpers";

const _getNumberOfDaysToModifyAndRemove = (
  clientProgramDays: TClientProgramDay[],
  oldCurrentPhase: TProgramPhase,
  newCurrentPhase: TProgramPhase,
  startDayIndex: number,
  phaseExtended: boolean
) => {
  // If not finite phase, then we don't need to worry about removing days since the number of days does not change
  // If phase is finite and extended, then we don't need to remove anything since we are not shortening the phase.
  if (
    oldCurrentPhase.mode !== "finite" ||
    newCurrentPhase.mode !== "finite" ||
    phaseExtended
  ) {
    return {
      numberOfDaysToRemove: 0,
      numberOfDaysToModify: clientProgramDays.length - startDayIndex,
    };
  }
  const newClientDaysLength =
    clientProgramDays.length - oldCurrentPhase.length + newCurrentPhase.length;
  const numberOfDaysToRemove = clientProgramDays.length - startDayIndex;
  const numberOfDaysToModify = newClientDaysLength - startDayIndex;

  return {
    numberOfDaysToRemove,
    numberOfDaysToModify,
  };
};

/**
 * @description Checks if current phase is extended or not.
 * @param days client program days
 * @param phaseLength length of current phase days created
 * @param defaultPhase length of the phase by default (stored under the program itself, not the client program)
 * @returns boolean value indicating if the phase is extended or not
 */
function _isPhaseExtended(
  days: TClientProgramDay[],
  currentClientPhase: TPhase,
  defaultPhase: TProgramPhase
): boolean {
  if (defaultPhase.mode !== "finite") return false;

  const phaseLength = currentClientPhase.value;
  const defaultPhaseLength = defaultPhase.length;

  if (defaultPhaseLength >= phaseLength) return false;

  const currentPhaseDays = days.slice(-phaseLength);

  const currDayIndex = currentPhaseDays.findIndex((day) => isToday(day.date));

  // If the current phase is finished and was longer than the base length, return true
  if (
    currDayIndex === -1 &&
    daysBetweenDates(new Date(), currentPhaseDays[0].date) > 0
  ) {
    return true;
  }

  return currDayIndex >= defaultPhaseLength;
}

/**
 * @description Creates references for clinician client, program version, and client program.
 * @returns references for clinician client, program version, and client program
 */
function _createReferences(
  clinicianId: string,
  clientId: string,
  clinicianClientId: string,
  program: TClinicianProgram,
  clientProgram: TClientProgram,
  version: string
) {
  const clinicianClientRef = createClinicianClientRef({
    clinicians: clinicianId,
    clients: clinicianClientId,
  });

  const programVersionRef = createProgramVersionRef({
    clinicians: clinicianId,
    programs: program.programVersionIdentifiers.programs,
    versions: version,
  });

  const clientProgramRef = createClientProgramRef({
    clients: clientId,
    programs: clientProgram.clientProgramIdentifiers.programs,
  });

  return { clinicianClientRef, programVersionRef, clientProgramRef };
}

/**
 * @description Updates client program's phases array by updating the last value with the new phase length.
 * @returns updated phase key value list with the updated length of the current phase stored in the last value
 */
function _updateClientProgramPhases(
  phases: TPhase[],
  currentPhaseId: `p${number}`,
  phaseLength: number
) {
  const updatedPhases = [...phases];
  updatedPhases.pop();
  updatedPhases.push({ key: currentPhaseId, value: phaseLength });
  return updatedPhases;
}

/**
 * @description Function that updates clinician client prescription and client program with the new modified version
 * @returns Boolean indicating if the operation was successful or not
 */
async function _updateProgramVersion(
  clientProgramRef: TClientProgramRef,
  clinicianClientRef: TClinicianClientRef,
  programVersionRef: TProgramVersionRef,
  updatedPhases: TPhase[]
) {
  return await Promise.all([
    await updateClientProgramFields(clientProgramRef, {
      clinicianClientRef,
      programVersionRef,
      shouldRefetch: true,
      phases: updatedPhases,
    }),
    await updateDoc(clinicianClientRef, {
      "prescription.programVersionRef": programVersionRef,
    }),
  ])
    .then(() => true)
    .catch(() => false);
}

function _getPhaseInfo(
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  oldProgram: TProgram
) {
  const currentClientPhase =
    clientProgram.phases[clientProgram.phases.length - 1];
  const currentPhaseId = currentClientPhase.key as `p${number}`;
  const currentPhase = program.phases[currentPhaseId];
  const oldCurrentPhase = oldProgram.phases[currentPhaseId];

  const currDayIndex =
    clientProgram.days.findIndex((day) => isToday(day.date)) || 0;
  const currentDay = clientProgram.days[currDayIndex].dayId;

  const startPhaseDayIndex = currDayIndex
    ? oldCurrentPhase.daysDeprecated.indexOf(currentDay)
    : 0;
  const startDocIndex =
    currDayIndex === -1 ? clientProgram.days.length : currDayIndex;

  return {
    currentClientPhase,
    currentPhaseId,
    currentPhase,
    oldCurrentPhase,
    currDayIndex,
    startDocIndex,
    startPhaseDayIndex,
  };
}

/**
 * @description Helper function to modify the client program's days.
 * @returns Boolean indicating if the operation was successful or not
 */
async function _modifyClientProgramDays(
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  oldProgram: TProgram,
  clinicianClientRef: TClinicianClientRef,
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  clientProgramRef: DocumentReference<TClientProgramRead, TClientProgramWrite>
) {
  const { days, trainingDays } = clientProgram;

  const {
    currentClientPhase,
    currentPhaseId,
    currentPhase,
    oldCurrentPhase,
    currDayIndex,
    startDocIndex,
    startPhaseDayIndex,
  } = _getPhaseInfo(clientProgram, program, oldProgram);

  const phaseExtended = _isPhaseExtended(
    days,
    currentClientPhase,
    currentPhase
  );

  // Phase length can vary when phase has been extended by client;
  const programPhaseLength = phaseExtended
    ? currentClientPhase.value
    : currentPhase.length || days.length;

  const { numberOfDaysToRemove, numberOfDaysToModify } =
    _getNumberOfDaysToModifyAndRemove(
      days,
      oldCurrentPhase,
      currentPhase,
      currDayIndex,
      phaseExtended
    );

  // Remove excess days if necessary.
  if (numberOfDaysToRemove > numberOfDaysToModify) {
    await removeDaysFromClientProgram(
      clientProgram.clientProgramRef,
      startDocIndex,
      numberOfDaysToRemove
    );
  }

  // Create and add new days to the program.
  const newDays = createPhase(
    trainingDays,
    program,
    currentPhaseId,
    new Date(),
    numberOfDaysToModify,
    currentPhase.days[startPhaseDayIndex] ? startPhaseDayIndex : 0
  );

  await addContinuousDaysToClientProgram(
    clientProgram.clientProgramRef,
    newDays,
    startDocIndex
  );

  const updatedPhases = _updateClientProgramPhases(
    clientProgram.phases,
    currentPhaseId,
    programPhaseLength
  );

  return await _updateProgramVersion(
    clientProgramRef,
    clinicianClientRef,
    programVersionRef,
    updatedPhases
  );
}

async function _modifyMaintenanceClientProgramDays(
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  clinicianClientRef: TClinicianClientRef,
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  clientProgramRef: DocumentReference<TClientProgramRead, TClientProgramWrite>
) {
  const { days, trainingDays } = clientProgram;

  const currDayIndex = days.findIndex((d) => isToday(d.date));

  // Phase days left
  const daysLeft = days.length - currDayIndex;

  // Id of the phase that maintenance phase is built on
  const lastPhaseId = clientProgram.phases[clientProgram.phases.length - 2].key;

  // Copy the last phase to the generated maintenance phase
  program.phases["m1" as any] = program.phases[lastPhaseId as TProgramPhaseKey];

  // Create and add new days to the program.
  const newDays = createPhase(
    trainingDays,
    program,
    "m1" as any,
    new Date(),
    daysLeft,
    currDayIndex
  );

  await addContinuousDaysToClientProgram(
    clientProgram.clientProgramRef,
    newDays,
    currDayIndex
  );

  return await _updateProgramVersion(
    clientProgramRef,
    clinicianClientRef,
    programVersionRef,
    clientProgram.phases
  );
}

/**
 * @description Helper function to change the client program's mode and update the client program accordingly.
 * @returns Boolean indicating if the operation was successful or not
 */
async function _changeClientProgramMode(
  clinicianId: string,
  clientId: string,
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  clinicianClientId: string,
  version: string,
  newCurrentPhaseId: `p${number}`
) {
  try {
    // Prepare references and current date.
    const { clinicianClientRef, programVersionRef, clientProgramRef } =
      _createReferences(
        clinicianId,
        clientId,
        clinicianClientId,
        program,
        clientProgram,
        version
      );
    // Destructure days and trainingDays from the client program
    const { days, trainingDays } = clientProgram;

    // Get the current phase ID from the client program
    const oldCurrentPhaseId = "p1" as `p${number}`;
    const currentPhaseId = newCurrentPhaseId;

    // Get the current phase from the program
    const currentPhase = program.phases[
      currentPhaseId
    ] as TProgramFinitePhaseRead;

    // Find the index of today's day in the client program days array
    const currDayIndex = days.findIndex((day) => isToday(day.date));

    // Calculate the start index for phase days and document updates
    const startDocIndex = currDayIndex === -1 ? days.length : currDayIndex;
    const daysLeft = days.length - startDocIndex;

    // If there are more days to remove than modify, remove the excess days
    if (currentPhase.length < daysLeft) {
      await removeDaysFromClientProgram(
        clientProgram.clientProgramRef,
        startDocIndex,
        daysLeft
      );
    }

    // Create new days for the current phase
    const newDays = createPhase(
      trainingDays,
      program,
      currentPhaseId,
      new Date(),
      currentPhase.length,
      0
    );

    // Add the newly created days to the client program
    await addContinuousDaysToClientProgram(
      clientProgram.clientProgramRef,
      newDays,
      startDocIndex
    );

    const updatedPhases: TPhase[] = [];
    // If there was at least one day finished, add old phase to array
    if (days.length > daysLeft) {
      const daysFinished = days.length - daysLeft;
      updatedPhases.push({
        key: oldCurrentPhaseId,
        value: daysFinished,
      });
    }
    // Add new phase to array
    updatedPhases.push({
      key: currentPhaseId,
      value: currentPhase.length,
    });
    // Update the client program with the new phases
    await _updateProgramVersion(
      clientProgramRef,
      clinicianClientRef,
      programVersionRef,
      updatedPhases
    );

    return true;
  } catch (error) {
    // Log any errors that occur during the process
    console.log("Error updating client program: ", error);
    return false;
  }
}

// TODO: Fix this fucntion describe it
export async function updateProgramDay(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  exercises: { iteration: number }[],
  adherence: number
) {
  try {
    const dayRef = createClientProgramDayRef({
      clients: clientId,
      programs: clientProgramId,
      days: dayId,
    });

    updateDoc(dayRef, {
      adherence: adherence,
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

// TODO: describe this function
export async function updateProgramDayDate(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  newDate: Date
) {
  try {
    const clientProgramDayRef = createClientProgramDayRef({
      clients: clientId,
      programs: clientProgramId,
      days: dayId,
    });

    return await updateDoc(clientProgramDayRef, {
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

// TODO: Fix this fucntion
export async function updateClientProgramFields(
  clientProgramRef: TClientProgramRef,
  fields: Partial<TClientProgramWrite>
) {
  // @ts-ignore
  return await updateDoc(clientProgramRef, {
    ...fields,
  })
    .then(() => true)
    .catch(() => false);
}

// TODO: Fix this fucntion
export async function completeProgram(
  clientId: string,
  clientProgramId: string
) {
  // TODO: take this ref in as field?
  const clientProgramRef = createClientProgramRef({
    clients: clientId,
    programs: clientProgramId,
  });

  return await updateDoc(clientProgramRef, {
    completed: true,
  })
    .then(() => true)
    .catch(() => false);
}

// TODO: Fix this fucntion
export async function removeRefetchFromProgram(
  clientId: string,
  clientProgramId: string
) {
  // TODO: take this ref in as field?
  const clientProgramRef = createClientProgramRef({
    clients: clientId,
    programs: clientProgramId,
  });

  return await updateDoc(clientProgramRef, {
    shouldRefetch: deleteField(),
  })
    .then(() => true)
    .catch((err) => {
      console.log("Error: ", err);
      return false;
    });
}

// Modify client program
export async function updateClientProgramVersion(
  clinicianId: string,
  clientId: string,
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  oldProgram: TProgram,
  clinicianClientId: string,
  version: string,
  isConverting: boolean = false,
  newCurrentPhaseId?: `p${number}`
) {
  try {
    // Handle conversion from continuous to finite mode if required.
    if (isConverting && newCurrentPhaseId) {
      return await _changeClientProgramMode(
        clinicianId,
        clientId,
        clientProgram,
        program,
        clinicianClientId,
        version,
        newCurrentPhaseId
      );
    }
    // Prepare references and current date.
    const { clinicianClientRef, programVersionRef, clientProgramRef } =
      _createReferences(
        clinicianId,
        clientId,
        clinicianClientId,
        program,
        clientProgram,
        version
      );

    const lastDay = clientProgram.days[clientProgram.days.length - 1];

    // No need to modify program days if the last day is in the past.
    if (isDateInPast(lastDay.date)) {
      return await _updateProgramVersion(
        clientProgramRef,
        clinicianClientRef,
        programVersionRef,
        clientProgram.phases
      );
    }

    const currentPhase = clientProgram.phases[clientProgram.phases.length - 1];
    // If currently in maintenance phase, need to modify with that in mind
    if (currentPhase.key.includes("m")) {
      return await _modifyMaintenanceClientProgramDays(
        clientProgram,
        program,
        clinicianClientRef,
        programVersionRef,
        clientProgramRef
      );
    }

    // Determine the number of days to remove or modify and update accordingly.
    return await _modifyClientProgramDays(
      clientProgram,
      program,
      oldProgram,
      clinicianClientRef,
      programVersionRef,
      clientProgramRef
    );
  } catch (error) {
    console.log("Error updating client program: ", error);
    return false;
  }
}

// Function that changes the phase a client is in
export async function changeClientPhase(
  clientProgram: TClientProgram,
  program: TProgram,
  newPhaseId: TProgramPhaseKey,
  clinicianClientRef: TClinicianClientRef
) {
  try {
    const { days, trainingDays } = clientProgram;

    // Check if the last day in the client program is before today
    const isLastDayFinished = isDateInPast(days[days.length - 1].date);

    // Find the index of the current day or set to -1 if last day is finished
    const currDayIndex = isLastDayFinished
      ? -1
      : days.findIndex((day) => isToday(day.date));

    // Determine start indices for removing days and adding new days
    const startDayIndex = currDayIndex === -1 ? 0 : currDayIndex;
    const startDocIndex = currDayIndex === -1 ? days.length : currDayIndex;

    // Calculate the number of days to remove from the current phase
    const numOfDaysToRemove = isLastDayFinished
      ? 0
      : days.length - startDayIndex;

    // Remove days from the client program if there are days to remove
    if (numOfDaysToRemove > 0) {
      await removeDaysFromClientProgram(
        clientProgram.clientProgramRef,
        startDocIndex,
        numOfDaysToRemove
      );
    }

    // Create new days for the new phase
    const newPhase = program.phases[newPhaseId];
    const newDays = createPhase(
      trainingDays,
      program,
      newPhaseId,
      new Date(), // Start the new phase from today
      newPhase.length || 14, // Default length of the new phase to 14 days if not specified
      0 // Start the new phase at day 0
    );

    // Add new days to the client program
    addContinuousDaysToClientProgram(
      clientProgram.clientProgramRef,
      newDays,
      startDocIndex
    );

    // Copy the existing phases
    const updatedPhases = [...clientProgram.phases];

    // If the last day is not finished, update the length of the current phase
    if (!isLastDayFinished) {
      const currentPhaseData = updatedPhases.pop() as TPhase;
      const updatedPhaseValue = currentPhaseData.value - numOfDaysToRemove;

      // Only add the updated phase if it still has days remaining
      if (updatedPhaseValue > 0) {
        updatedPhases.push({
          ...currentPhaseData,
          value: updatedPhaseValue,
        });
      }
    }

    // Add the new phase information
    updatedPhases.push({
      key: newPhaseId,
      value: newDays.length,
    });

    // Update the client program with the new phases and reference to the clinician client
    updateClientProgramFields(clientProgram.clientProgramRef, {
      phases: updatedPhases,
      clinicianClientRef,
      shouldRefetch: true, // Flag to indicate that the client program should be refetched
    });

    return true;
  } catch (error) {
    console.error(error); // Log the error for debugging
    return false; // Return false if an error occurs
  }
}
