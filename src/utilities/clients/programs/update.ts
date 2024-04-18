import { DocumentReference, deleteField, doc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClientProgram,
  TClientProgramDayWrite,
  TClientProgramWrite,
} from "../../../types/clientTypes";
import { updateDoc } from "../../updateDoc";
import {
  TClinicianProgram,
  TProgram,
  TProgramPhaseKey,
  TProgramWrite,
} from "../../../types/programTypes";
import { createPhase } from "../../programHelpers";
import { addContinuousDaysToClientProgram } from "./add";
import { TClinicianClientWrite } from "../../../types/clinicianTypes";

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
export async function updateClientProgramVersion(
  clientId: string,
  clientProgram: TClientProgram,
  program: TClinicianProgram,
  clinicianId: string,
  clinicianClientId: string,
  version: string
) {
  try {
    // start by removing the current day and future days from the client's program
    const { days, trainingDays } = clientProgram;
    const currentPhaseId = clientProgram.phases[clientProgram.phases.length - 1]
      .key as `p${number}`;
    // filter the days to only include days that are before the current day in current phase and count them
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysBeforeCurrent = days.filter(
      (day) =>
        day.date.getTime() < today.getTime() && day.phaseId === currentPhaseId
    );

    // find the current day index in the client program if it does not exist, set it to 0
    const currDay = days.findIndex(
      (day) => day.date.getTime() === today.getTime()
    );

    const startDayIndex = currDay === -1 ? 0 : currDay;
    const startDocIndex = currDay === -1 ? days.length : currDay;

    const phaseLength = days.length - startDayIndex;
    // call the function  that adds a continuous phase to client
    const newDays = createPhase(
      trainingDays,
      program,
      currentPhaseId,
      new Date(),
      phaseLength,
      0 // on start of new phase, start at day 0
    );
    console.log("newDays", newDays);

    addContinuousDaysToClientProgram(
      clientId,
      clientProgram.clientProgramId,
      newDays,
      startDocIndex
    );

    // then update the phases map property of the client's program so that it is correct

    const updatedPhases = [...clientProgram.phases];
    const oldPhaseData = updatedPhases.pop();
    // const currentPhase = updatedPhases[updatedPhases.length - 1];

    // if (daysBeforeCurrent.length === 0) {
    //   updatedPhases.pop();
    // } else if (daysBeforeCurrent.length > 0) {
    //   updatedPhases[updatedPhases.length - 1] = {
    //     ...currentPhase,
    //     value: daysBeforeCurrent.length,
    //   };
    // }

    updatedPhases.push({
      key: currentPhaseId,
      value: oldPhaseData?.value || days.length,
    });

    console.log("updatedPhases after push:", updatedPhases, {
      clinicianClientRef: doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId
      ) as DocumentReference<TClinicianClientWrite>,
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
  newPhase: TProgramPhaseKey,
  currentPhaseId: TProgramPhaseKey,
  clinicianId: string,
  clinicianClientId: string
) {
  // start by removing the current day and future days from the client's program
  const { days, trainingDays } = clientProgram;

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

  // find the current day index in the client program if it does not exist, set it to 0
  const currDay = days.findIndex(
    (day) => day.date.getTime() === today.getTime()
  );

  const startDayIndex = currDay === -1 ? 0 : currDay;
  const startDocIndex = currDay === -1 ? days.length : currDay;

  console.log("startDayIndex", startDayIndex);
  console.log("startDocIndex", startDocIndex);

  const phaseLength = days.length - startDayIndex;
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
    startDocIndex
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

  console.log("updatedPhases after push:", updatedPhases, {
    clinicianClientRef: doc(
      db,
      "clinicians",
      clinicianId,
      "clients",
      clinicianClientId
    ) as DocumentReference<TClinicianClientWrite>,
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
    shouldRefetch: true,
  });
}
