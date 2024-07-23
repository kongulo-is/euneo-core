import {
  DocumentReference,
  deleteField,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";

import { updateDoc } from "../../updateDoc";

import { createPhase } from "../../programHelpers";
import { addContinuousDaysToClientProgram } from "./add";

import {
  clientProgramConverter,
  clientProgramDayConverter,
} from "../../converters";
import { removeDaysFromClientProgram } from "./delete";
import {
  TProgramPhase,
  TProgramPhaseKey,
} from "../../../entities/program/programPhase";
import {
  TClinicianProgram,
  TProgram,
  TProgramWrite,
} from "../../../entities/program/program";
import { TClientProgramDay } from "../../../entities/client/day";
import { TClinicianWrite } from "../../../entities/clinician/clinician";
import {
  createClinicianClientRef,
  TClinicianClientRef,
  TClinicianClientWrite,
} from "../../../entities/clinician/clinicianClient";
import { TPhase } from "../../../entities/client/phase";
import {
  TClientProgram,
  TClientProgramRead,
  TClientProgramWrite,
} from "../../../entities/client/clientProgram";
import {
  createProgramVersionRef,
  TProgramVersionRef,
} from "../../../entities/program/version";

const _getNumberOfDaysToModifyAndRemove = (
  clientProgramDays: TClientProgramDay[],
  oldCurrentPhase: TProgramPhase,
  newCurrentPhase: TProgramPhase,
  startDayIndex: number,
) => {
  // If not finite phase, then we don't need to worry about removing days since the number of days does not change
  if (oldCurrentPhase.mode !== "finite" || newCurrentPhase.mode !== "finite") {
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

// Helper function to update program fields
const _updateProgram = async (
  clientId: string,
  clientProgramId: string,
  clinicianClientRef: TClinicianClientRef,
  programVersionRef: TProgramVersionRef,
  updatedPhases: TPhase[],
) => {
  await updateProgramFields(clientId, clientProgramId, {
    clinicianClientRef,
    programVersionRef,
    shouldRefetch: true,
    phases: updatedPhases,
  });
  await updateDoc(clinicianClientRef, {
    "prescription.programRef": programVersionRef,
  });
};

// TODO: Fix this fucntion
export async function updateProgramDay(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  exercises: { iteration: number }[],
  adherence: number,
) {
  try {
    const day = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId,
      "days",
      dayId.toString(),
    ) as DocumentReference<TClientProgramDayWrite>;

    updateDoc(day, {
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

// TODO: Fix this fucntion
export async function updateProgramDayDate(
  clientId: string,
  clientProgramId: string,
  dayId: string,
  newDate: Date,
) {
  try {
    const day = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgramId,
      "days",
      dayId,
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

// TODO: Fix this fucntion
export async function updateProgramFields(
  clientId: string,
  clientProgramId: string,
  fields: Partial<TClientProgramWrite>,
) {
  // TODO: take this ref in as field
  const clientProgramRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId,
  ) as DocumentReference<TClientProgramRead, TClientProgramWrite>;

  return await updateDoc(clientProgramRef, {
    ...fields,
  })
    .then(() => true)
    .catch(() => false);
}

// TODO: Fix this fucntion
export async function completeProgram(
  clientId: string,
  clientProgramId: string,
) {
  const clientProgramRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId,
  ) as DocumentReference<TClientProgramWrite>;

  return await updateDoc(clientProgramRef, {
    completed: true,
  })
    .then(() => true)
    .catch(() => false);
}

// TODO: Fix this fucntion
export async function removeRefetchFromProgram(
  clientId: string,
  clientProgramId: string,
) {
  const clientProgramRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId,
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

// Modify client program
export async function updateClientProgramVersion(
  clinicianId: string,
  clientId: string,
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  oldProgram: TProgram,
  clinicianClientId: string,
  version: string,
) {
  try {
    // Destructure days and trainingDays from the client program
    const { days, trainingDays } = clientProgram;

    // Get the current phase ID from the client program
    const currentPhaseId = clientProgram.phases[clientProgram.phases.length - 1]
      .key as `p${number}`;

    // Get the current and old phases from the programs
    const currentPhase = program.phases[currentPhaseId];
    const oldCurrentPhase = oldProgram.phases[currentPhaseId];

    // Set today's date with time set to 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // TODO: find a smarter way to do this, use the refs in the program? and stop using as
    const clinicianRef = doc(
      db,
      "clinicians",
      clinicianId,
    ) as DocumentReference<TClinicianWrite>;

    const clinicianClientRef = createClinicianClientRef({
      clinicians: clinicianId,
      clients: clinicianClientId,
    });

    const programVersionRef = createProgramVersionRef({
      clinicians: clinicianId,
      programs: program.programVersionIdentifiers.programs,
      versions: version,
    });

    // If the last day in the client program is before today, update the program and exit
    if (days[days.length - 1].date < today) {
      await _updateProgram(
        clientId,
        clientProgram.clientProgramIdentifiers.programs,
        clinicianClientRef,
        programVersionRef,
        clientProgram.phases,
      );
      return true;
    }

    // Find the index of today's day in the client program days array
    const currDayIndex =
      days.findIndex((day) => day.date.getTime() === today.getTime()) || 0;

    // Calculate the start index for phase days and document updates
    const currentDay = days[currDayIndex].dayId;
    const startPhaseDayIndex = currDayIndex
      ? oldCurrentPhase.daysDeprecated.indexOf(currentDay)
      : 0;
    const startDocIndex = currDayIndex === -1 ? days.length : currDayIndex;

    // Get the number of days to remove and modify based on phase changes
    const { numberOfDaysToRemove, numberOfDaysToModify } =
      _getNumberOfDaysToModifyAndRemove(
        days,
        oldCurrentPhase,
        currentPhase,
        currDayIndex,
      );

    // If there are more days to remove than modify, remove the excess days
    if (numberOfDaysToRemove > numberOfDaysToModify) {
      await removeDaysFromClientProgram(
        clientId,
        clientProgram.clientProgramId,
        startDocIndex,
        numberOfDaysToRemove,
      );
    }

    // Create new days for the current phase
    const newDays = createPhase(
      trainingDays,
      program,
      currentPhaseId,
      new Date(),
      numberOfDaysToModify,
      currentPhase.days[startPhaseDayIndex] ? startPhaseDayIndex : 0,
    );

    // Add the newly created days to the client program
    await addContinuousDaysToClientProgram(
      clientId,
      clientProgram.clientProgramId,
      newDays,
      startDocIndex,
    );

    // Update the phases array with the new phase information
    const updatedPhases = [...clientProgram.phases];
    const oldPhaseData = updatedPhases.pop();
    const currentPhaseLength =
      currentPhase.mode === "finite"
        ? currentPhase.length
        : oldPhaseData?.value || days.length;

    updatedPhases.push({ key: currentPhaseId, value: currentPhaseLength });

    // Update the client program with the new phases
    await _updateProgram(
      clientId,
      clientProgram.clientProgramId,
      clinicianClientRef,
      programRef,
      updatedPhases,
    );

    return true;
  } catch (error) {
    // Log any errors that occur during the process
    console.log("Error updating client program: ", error);
    return false;
  }
}

// Function that sets data from updated client program to document. Also updates prescription of user if set to true
export async function setClientProgramVersion<T extends TProgram>(
  clientId: string,
  updatedClientProgram: TClientProgram,
  program: T,
  clinicianId: string,
  clinicianClientId: string,
  version: string,
  updatePrescription?: boolean,
) {
  try {
    // start by removing the current day and future days from the client's program
    const { days: newDays } = updatedClientProgram;

    addContinuousDaysToClientProgram(
      clientId,
      updatedClientProgram.clientProgramId,
      newDays,
      0,
    );

    const programRef = (
      "euneoProgramId" in program
        ? doc(
            db,
            "programs",
            program.euneoProgramId,
            "versions",
            program.version,
          )
        : doc(
            db,
            "clinicians",
            clinicianId,
            "programs",
            program.clinicianProgramId,
            "versions",
            version,
          )
    ) as DocumentReference<TProgramWrite>;

    updateProgramFields(clientId, updatedClientProgram.clientProgramId, {
      phases: updatedClientProgram.phases,
      clinicianClientRef: doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId,
      ) as DocumentReference<TClinicianClientWrite>,
      programRef,
      shouldRefetch: true,
    });

    if (updatePrescription) {
      // Update prescription program reference
      const clinicanRef = doc(
        db,
        "clinicians",
        clinicianId,
      ) as DocumentReference<TClinicianWrite>;
      const clinicianClientRef = doc(
        clinicanRef,
        "clients",
        clinicianClientId,
      ) as DocumentReference<TClinicianClientWrite>;
      updateDoc(clinicianClientRef, {
        "prescription.programRef": programRef,
      });
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Function that changes the phase a client is in
export async function changeClientPhase(
  clientProgram: TClientProgram,
  clientId: string,
  program: TProgram,
  newPhaseId: TProgramPhaseKey,
  currentPhaseId: TProgramPhaseKey,
  clinicianId: string,
  clinicianClientId: string,
) {
  try {
    const { days, trainingDays } = clientProgram;

    // Set today's date to midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the last day in the client program is before today
    const isLastDayFinished = days[days.length - 1].date < today;

    // Find the index of the current day or set to -1 if last day is finished
    const currDayIndex = isLastDayFinished
      ? -1
      : days.findIndex((day) => day.date.getTime() === today.getTime());

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
        clientId,
        clientProgram.clientProgramId,
        startDocIndex,
        numOfDaysToRemove,
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
      0, // Start the new phase at day 0
    );

    // Add new days to the client program
    addContinuousDaysToClientProgram(
      clientId,
      clientProgram.clientProgramId,
      newDays,
      startDocIndex,
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
    updateProgramFields(clientId, clientProgram.clientProgramId, {
      phases: updatedPhases,
      clinicianClientRef: doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId,
      ) as DocumentReference<TClinicianClientWrite>,
      shouldRefetch: true, // Flag to indicate that the client program should be refetched
    });

    return true;
  } catch (error) {
    console.error(error); // Log the error for debugging
    return false; // Return false if an error occurs
  }
}

// TODO: Deprecated program functions
// Upgrade old programs so version is used
export async function updatePastClientProgram(
  clientId: string,
  clientProgram: TClientProgram,
) {
  try {
    const clientProgramRef = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgram.clientProgramId,
    ) as DocumentReference<TClientProgramWrite>;
    await setDoc(
      clientProgramRef.withConverter(clientProgramConverter),
      clientProgram,
      { merge: true },
    );

    await Promise.all(
      clientProgram.days.map((day, i) => {
        const dayCol = doc(
          db,
          "clients",
          clientId,
          "programs",
          clientProgram.clientProgramId,
          "days",
          i.toString(),
        );
        return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
      }),
    );

    return true;
  } catch (error) {
    return false;
  }
}
