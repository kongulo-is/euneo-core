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

// function that changes the phase a client is in
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
    // find the current day index in the client program if it does not exist, set it to 0
    const currDay = days.findIndex(
      (day) => day.date.getTime() === today.getTime()
    );

    // Index of the current phase day
    const currDayIndex = currDay === -1 ? 0 : currDay;
    // Index of the exercise day the client is currently on
    const startPhaseDayIndex = currDay
      ? oldCurrentPhase.days.indexOf(days[currDay].dayId)
      : 0;

    // Index of were we should start adding / modifying / removing
    const startDocIndex = currDay === -1 ? days.length : currDay;

    // Get number of days we need to remove and modify from the client program (in the current phase)
    const { numberOfDaysToRemove, numberOfDaysToModify } =
      _getNumberOfDaysToModifyAndRemove(
        days,
        oldCurrentPhase,
        currentPhase,
        currDayIndex
      );
    // We only need to remove days from client program if we are decreasing number of days in current phase
    if (numberOfDaysToRemove > numberOfDaysToModify) {
      removeDaysFromClientProgram(
        clientId,
        clientProgram.clientProgramId,
        startDocIndex,
        numberOfDaysToRemove
      );
    }
    // call the function  that adds a continuous phase to client
    const newDays = createPhase(
      trainingDays,
      program,
      currentPhaseId,
      new Date(),
      numberOfDaysToModify,
      currentPhase.days[startPhaseDayIndex] ? startPhaseDayIndex : 0
    );
    addContinuousDaysToClientProgram(
      clientId,
      clientProgram.clientProgramId,
      newDays,
      startDocIndex
    );

    // then update the phases map property of the client's program so that it is correct
    const updatedPhases = [...clientProgram.phases];
    const oldPhaseData = updatedPhases.pop();

    // Updating current phase length based on the mode of the phase (new phase length if finite, else old value or length of days in program)
    const currentPhaseLength =
      currentPhase.mode === "finite"
        ? currentPhase.length
        : oldPhaseData?.value || days.length;

    updatedPhases.push({
      key: currentPhaseId,
      value: currentPhaseLength,
    });

    updateProgramFields(clientId, clientProgram.clientProgramId, {
      phases: updatedPhases,
      clinicianClientRef: doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId
      ) as DocumentReference<TClinicianClientWrite>,
      programRef: doc(
        db,
        "clinicians",
        clinicianId,
        "programs",
        program.clinicianProgramId,
        "versions",
        version
      ) as DocumentReference<TProgramWrite>,
      shouldRefetch: true,
    });

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
      "prescription.programRef": doc(
        clinicanRef,
        "programs",
        program.clinicianProgramId,
        "versions",
        version
      ),
    });

    return true;
  } catch (error) {
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

// function that changes the phase a client is in
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

    const currentPhase = program.phases[currentPhaseId];
    const newPhase = program.phases[newPhaseId];
    // filter the days to only include days that are before the current day in current phase and count them
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // find the current day index in the client program if it does not exist, set it to 0
    const currDay = days.findIndex(
      (day) => day.date.getTime() === today.getTime()
    );

    const startDayIndex = currDay === -1 ? 0 : currDay;
    const startDocIndex = currDay === -1 ? days.length : currDay;

    // Remove days from current phase that are from today and to end of the phase
    const numOfDaysToRemove = days.length - startDayIndex;
    if (numOfDaysToRemove > 0) {
      await removeDaysFromClientProgram(
        clientId,
        clientProgram.clientProgramId,
        startDocIndex,
        numOfDaysToRemove
      );
    }

    // call the function  that adds a continuous phase to client
    const newDays = createPhase(
      trainingDays,
      program,
      newPhaseId,
      new Date(),
      newPhase.length || 14,
      0 // on start of new phase, start at day 0
    );

    // Add new days to client program
    addContinuousDaysToClientProgram(
      clientId,
      clientProgram.clientProgramId,
      newDays,
      startDocIndex
    );

    const updatedPhases = [...clientProgram.phases];
    const currentPhaseData = updatedPhases.pop() as TPhase;

    // Update old current phase length
    if (currentPhaseData.value - numOfDaysToRemove > 0) {
      updatedPhases.push({
        ...currentPhaseData,
        value: currentPhaseData.value - numOfDaysToRemove,
      });
    }

    // Add new phase info
    updatedPhases.push({
      key: newPhaseId,
      value: newDays.length,
    });

    console.log("updatedPhases", updatedPhases);

    // Update phase information in client program
    updateProgramFields(clientId, clientProgram.clientProgramId, {
      phases: updatedPhases,
      clinicianClientRef: doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId
      ) as DocumentReference<TClinicianClientWrite>,
      shouldRefetch: true,
    });

    return true;
  } catch (error) {
    return false;
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
