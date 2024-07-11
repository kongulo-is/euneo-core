import {
  DocumentReference,
  deleteField,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClientProgram,
  TClientProgramDay,
  TClientProgramDayWrite,
  TClientProgramWrite,
  TPhase,
} from "../../../types/clientTypes";
import { updateDoc } from "../../updateDoc";
import {
  TClinicianProgram,
  TProgram,
  TProgramPhaseKey,
  TProgramWrite,
  TEuneoProgram,
  TProgramPhase,
} from "../../../types/programTypes";
import { createPhase } from "../../programHelpers";
import { addContinuousDaysToClientProgram } from "./add";
import {
  TClinicianClientWrite,
  TClinicianWrite,
} from "../../../types/clinicianTypes";
import {
  clientProgramConverter,
  clientProgramDayConverter,
} from "../../converters";
import { removeDaysFromClientProgram } from "./delete";

const _getNumberOfDaysToModifyAndRemove = (
  clientProgramDays: TClientProgramDay[],
  oldCurrentPhase: TProgramPhase,
  newCurrentPhase: TProgramPhase,
  startDayIndex: number
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

// Helper function to get document references
const _getDocRef = (
  clinicianId: string,
  clinicianClientId: string,
  programId: string,
  version: string
) => {
  const clinicianRef = doc(
    db,
    "clinicians",
    clinicianId
  ) as DocumentReference<TClinicianWrite>;
  const clinicianClientRef = doc(
    clinicianRef,
    "clients",
    clinicianClientId
  ) as DocumentReference<TClinicianClientWrite>;
  const programRef = doc(
    clinicianRef,
    "programs",
    programId,
    "versions",
    version
  ) as DocumentReference<TProgramWrite>;

  return { clinicianRef, clinicianClientRef, programRef };
};

// Helper function to update program fields
const _updateProgram = async (
  clientId: string,
  clientProgramId: string,
  clinicianClientRef: DocumentReference<TClinicianClientWrite>,
  programRef: DocumentReference<TProgramWrite>
) => {
  await updateProgramFields(clientId, clientProgramId, {
    clinicianClientRef,
    programRef,
    shouldRefetch: true,
  });
  await updateDoc(clinicianClientRef, {
    "prescription.programRef": programRef,
  });
};

export async function updateProgramDay(
  clientId: string,
  clientProgramId: string,
  dayId: string,
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

export async function updateClientProgramVersion(
  clinicianId: string,
  clientId: string,
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  oldProgram: TClinicianProgram,
  clinicianClientId: string,
  version: string
) {
  try {
    const { days, trainingDays } = clientProgram;
    const currentPhaseId = clientProgram.phases[clientProgram.phases.length - 1]
      .key as `p${number}`;
    const currentPhase = program.phases[currentPhaseId];
    const oldCurrentPhase = oldProgram.phases[currentPhaseId];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get document references
    const { clinicianClientRef, programRef } = _getDocRef(
      clinicianId,
      clinicianClientId,
      program.clinicianProgramId,
      version
    );

    if (days[days.length - 1].date < today) {
      await _updateProgram(
        clientId,
        clientProgram.clientProgramId,
        clinicianClientRef,
        programRef
      );
      return true;
    }

    const currDayIndex =
      days.findIndex((day) => day.date.getTime() === today.getTime()) || 0;
    const startPhaseDayIndex = currDayIndex
      ? oldCurrentPhase.days.indexOf(days[currDayIndex].dayId)
      : 0;
    const startDocIndex = currDayIndex === -1 ? days.length : currDayIndex;

    const { numberOfDaysToRemove, numberOfDaysToModify } =
      _getNumberOfDaysToModifyAndRemove(
        days,
        oldCurrentPhase,
        currentPhase,
        currDayIndex
      );

    if (numberOfDaysToRemove > numberOfDaysToModify) {
      await removeDaysFromClientProgram(
        clientId,
        clientProgram.clientProgramId,
        startDocIndex,
        numberOfDaysToRemove
      );
    }

    const newDays = createPhase(
      trainingDays,
      program,
      currentPhaseId,
      new Date(),
      numberOfDaysToModify,
      currentPhase.days[startPhaseDayIndex] ? startPhaseDayIndex : 0
    );
    await addContinuousDaysToClientProgram(
      clientId,
      clientProgram.clientProgramId,
      newDays,
      startDocIndex
    );

    const updatedPhases = [...clientProgram.phases];
    const oldPhaseData = updatedPhases.pop();
    const currentPhaseLength =
      currentPhase.mode === "finite"
        ? currentPhase.length
        : oldPhaseData?.value || days.length;

    updatedPhases.push({ key: currentPhaseId, value: currentPhaseLength });
    await _updateProgram(
      clientId,
      clientProgram.clientProgramId,
      clinicianClientRef,
      programRef
    );

    return true;
  } catch (error) {
    console.log("Error updating client program: ", error);
    return false;
  }
}

// Function that sets data from updated client program to document. Also updates prescription of user if set to true
export async function setClientProgramVersion<
  T extends TClinicianProgram | TEuneoProgram,
>(
  clientId: string,
  updatedClientProgram: TClientProgram,
  program: T,
  clinicianId: string,
  clinicianClientId: string,
  version: string,
  updatePrescription?: boolean
) {
  try {
    // start by removing the current day and future days from the client's program
    const { days: newDays } = updatedClientProgram;

    addContinuousDaysToClientProgram(
      clientId,
      updatedClientProgram.clientProgramId,
      newDays,
      0
    );

    const programRef = (
      "euneoProgramId" in program
        ? doc(
            db,
            "programs",
            program.euneoProgramId,
            "versions",
            program.version
          )
        : doc(
            db,
            "clinicians",
            clinicianId,
            "programs",
            program.clinicianProgramId,
            "versions",
            version
          )
    ) as DocumentReference<TProgramWrite>;

    updateProgramFields(clientId, updatedClientProgram.clientProgramId, {
      phases: updatedClientProgram.phases,
      clinicianClientRef: doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId
      ) as DocumentReference<TClinicianClientWrite>,
      programRef,
      shouldRefetch: true,
    });

    if (updatePrescription) {
      // Update prescription program reference
      const clinicanRef = doc(
        db,
        "clinicians",
        clinicianId
      ) as DocumentReference<TClinicianWrite>;
      const clinicianClientRef = doc(
        clinicanRef,
        "clients",
        clinicianClientId
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
  clinicianClientId: string
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
      clientId,
      clientProgram.clientProgramId,
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
    updateProgramFields(clientId, clientProgram.clientProgramId, {
      phases: updatedPhases,
      clinicianClientRef: doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId
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
  clientProgram: TClientProgram
) {
  try {
    const clientProgramRef = doc(
      db,
      "clients",
      clientId,
      "programs",
      clientProgram.clientProgramId
    ) as DocumentReference<TClientProgramWrite>;
    await setDoc(
      clientProgramRef.withConverter(clientProgramConverter),
      clientProgram,
      { merge: true }
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
          i.toString()
        );
        return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
      })
    );

    return true;
  } catch (error) {
    return false;
  }
}
