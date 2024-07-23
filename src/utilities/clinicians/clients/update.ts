import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import { createModifiedClinicianProgramVersion } from "../programs/update";
import { createModifiedVersion } from "../../programHelpers";
import { getDeprecatedClinicianClientPastPrescriptions } from "./get";
import { getDeprecatedClientProgram } from "../../clients/programs/get";
import {
  setClientProgramVersion,
  updatePastClientProgram,
} from "../../clients/programs/update";
import { removeClinicianClientPastPrescription } from "./remove";
import {
  TClinicianClient,
  TClinicianClientRead,
  TClinicianClientRef,
  TClinicianClientWrite,
} from "../../../entities/clinician/clinicianClient";
import { updateDoc } from "../../updateDoc";
import {
  prescriptionConverter,
  TPrescription,
} from "../../../entities/clinician/prescription";
import { TProgram } from "../../../entities/program/program";
import { TClientProgram } from "../../../entities/client/clientProgram";

/**
 * @description This function updates the client document in the database
 */
export async function updateClinicianClient(
  clinicianClientRef: TClinicianClientRef,
  clinicianClient: Partial<TClinicianClientRead>,
): Promise<boolean> {
  try {
    await updateDoc(clinicianClientRef, clinicianClient);

    return true;
  } catch (error) {
    console.error("Error updating clinician client: ", error, {
      clinicianClientRef,
      clinicianClient,
    });
    throw error;
  }
}

export async function changeClinicianClientPrescription(
  clinicianClientRef: TClinicianClientRef,
  newPrescription: TPrescription,
): Promise<boolean> {
  try {
    const prescriptionConverted =
      prescriptionConverter.toFirestore(newPrescription);

    await updateDoc(clinicianClientRef, {
      prescription: prescriptionConverted,
    });

    return true;
  } catch (error) {
    console.error("Error updating clinician client prescription: ", error, {
      clinicianClientRef,
      newPrescription,
    });
    return false;
  }
}

/**
 * @description used in app? // TODO: Explain what this function does, examples are great
 */
export async function updateClinicianClientPrescriptionStatus(
  clinicianId: string,
  clinicianClientId: string,
  clientId: string,
  clientProgramId: string,
  status: TPrescription["status"],
): Promise<void> {
  try {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      clinicianId,
      "clients",
      clinicianClientId,
    ) as DocumentReference<TClinicianClientWrite>;

    const clinicianClient = await getDoc(clinicianClientRef);
    const prescription = {
      ...clinicianClient.data()?.prescription,
      clientProgramRef: doc(
        db,
        "clients",
        clientId,
        "programs",
        clientProgramId,
      ) as DocumentReference<TClientProgramWrite, DocumentData>,
      status: status,
    };

    updateDoc(clinicianClientRef, {
      prescription: prescription,
    });
  } catch (error) {
    console.error("Error updating clinician client prescription: ", error, {
      clinicianClientId,
      clinicianId,
      clientId,
      clientProgramId,
    });
    throw error;
  }
}

/**
 * @description // TODO: Explain what this function does, examples are great
 */
function _createIdWithoutUnderscore<T extends "p" | "d">(
  prefix: T,
  key: string,
): `${T}${number}` {
  const oldId = key.split("_")[1];
  const keyNumber = parseInt(oldId.split(prefix)[1]);
  const newId = `${prefix}${keyNumber + 1}`;
  return newId as `${T}${number}`;
}

function _createClientProgramVersion(
  client: TClinicianClient,
  selectedProgram: TProgram,
): TProgram {
  if ("euneoProgramId" in selectedProgram) {
    return {
      ...selectedProgram,
      version: "1.0",
    };
  } else {
    const programRef = doc(
      db,
      "clinicians",
      selectedProgram.clinicianId,
      "programs",
      selectedProgram.clinicianProgramId,
      "versions",
      selectedProgram.version,
    );
    const newVersion = createModifiedVersion("1.0");

    const clientPhaseIds = Object.keys(selectedProgram.phases).filter(
      (phaseKey) => {
        const phaseId = phaseKey;
        return (
          phaseId.includes(client.clinicianClientId) || !phaseId.includes("_")
        );
      },
    ) as TProgramPhaseKey[];

    const clientDayIds = Object.keys(selectedProgram.days).filter((dayKey) => {
      const dayId = dayKey as `d${number}`;
      return dayId.includes(client.clinicianClientId) || !dayId.includes("_");
    }) as TProgramDayKey[];

    const phasesRef = collection(programRef, "phases");
    // change ids where _ is in from ${id}_p${number} to p${number + 1}
    const phases = clientPhaseIds.reduce(
      (acc, phaseId) => {
        if (phaseId.includes("_")) {
          // Delete modified phase from base version
          deleteDoc(doc(phasesRef, phaseId));
          // TODO: remove or check how this  works
          const newPhaseId = _createIdWithoutUnderscore("p", phaseId);
          const days = selectedProgram.phases[phaseId].days.map((dayId) =>
            _createIdWithoutUnderscore("d", dayId),
          );
          return {
            ...acc,
            [newPhaseId]: {
              ...selectedProgram.phases[phaseId],
              days,
              version: newVersion,
            },
          };
        } else {
          return {
            ...acc,
            [phaseId]: {
              ...selectedProgram.phases[phaseId],
              version: newVersion,
            },
          };
        }
      },
      {} as Record<`p${number}`, TProgramPhase>,
    );

    const daysRef = collection(programRef, "days");
    // change ids where _ is in ${id}_d${number} to d${number + 1}
    const days = clientDayIds.reduce(
      (acc, dayId) => {
        if (dayId.includes("_")) {
          // Delete modified day from base version
          deleteDoc(doc(daysRef, dayId));
          const newDayId = _createIdWithoutUnderscore("d", dayId);
          return {
            ...acc,
            [newDayId]: selectedProgram.days[dayId],
          };
        } else {
          return {
            ...acc,
            [dayId]: selectedProgram.days[dayId],
          };
        }
      },
      {} as Record<`d${number}`, TProgramDay>,
    );

    return {
      ...selectedProgram,
      phases,
      days,
      version: newVersion,
    };
  }
}

/**
 * @description is this deprecated? // TODO: Explain what this function does, examples are great
 *
 */
function _upgradeClientProgram(
  oldClientProgram: TClientProgram,
  newVersion: string,
) {
  return {
    ...oldClientProgram,
    phases: oldClientProgram.phases.map((phaseObj) => {
      const oldKeyPhase = phaseObj.key;
      if (oldKeyPhase.includes("_")) {
        const newPhaseId = _createIdWithoutUnderscore("p", oldKeyPhase);
        return {
          ...phaseObj,
          key: newPhaseId,
        };
      }
      return phaseObj;
    }),
    days: oldClientProgram.days.map((day) => {
      const oldDayId = day.dayId;
      const oldPhaseId = day.phaseId;
      if (oldDayId.includes("_")) {
        const newDayId = _createIdWithoutUnderscore<"d">("d", oldDayId);
        const newPhaseId = _createIdWithoutUnderscore<"p">("p", oldPhaseId);
        return {
          ...day,
          dayId: newDayId,
          phaseId: newPhaseId,
        };
      }
      return day;
    }),
    programVersion: newVersion,
  };
}
/**
 * @description is this deprecated? // TODO: Explain what this function does, examples are great
 *
 */
function _updateClient(client: TClinicianClient, program: TProgram) {
  const updatedClient = { ...client };
  if (client.prescription) {
    updatedClient.prescription = {
      ...client.prescription,
      version: program.version,
    };
  }
  if (client.clientProgram) {
    updatedClient.clientProgram = _upgradeClientProgram(
      client.clientProgram,
      program.version,
    );
  }

  return updatedClient;
}

/**
 * @description is this deprecated? // TODO: Explain what this function does, examples are great
 *
 */
export async function updatePastPrescription(
  clinicianId: string,
  clinicianClientId: string,
  prescription: TPrescription,
  prescriptionDocId: string,
  programVersion: string,
) {
  const clinicianClientRef = doc(
    db,
    "clinicians",
    clinicianId,
    "clients",
    clinicianClientId,
  ) as DocumentReference<TClinicianClientWrite>;
  const pastPrescriptionRef = doc(
    clinicianClientRef,
    "pastPrescriptions",
    prescriptionDocId,
  ) as DocumentReference<TPrescriptionWrite>;
  const convertedPrescription = prescriptionConverter.toFirestore({
    ...prescription,
    version: programVersion,
  });
  await updateDoc(pastPrescriptionRef, {
    programRef: convertedPrescription.programRef,
  });
}
/**
 * @description deprecated? // TODO: Explain what this function does, examples are great
 */
async function upgradeClinicianClientCurrentPrescription(
  clinicianId: string,
  client: TClinicianClient,
  clinicianPrograms: TClinicianProgram[],
  euneoPrograms: TEuneoProgram[],
) {
  if (client.clientProgram && !client.clientProgram.programVersion) {
    // If no program version we have a deprecated program
    const hasEuneoProgram = "euneoProgramId" in client.clientProgram;
    // Find the program the client is prescribed to
    const selectedProgram = hasEuneoProgram
      ? (euneoPrograms.find(
          (program) =>
            program.euneoProgramId ===
            (client.clientProgram as TClientEuneoProgram).euneoProgramId,
        ) as TEuneoProgram)
      : (clinicianPrograms.find(
          (program) =>
            program.clinicianProgramId ===
            (client.clientProgram as TClientClinicianProgram)
              .clinicianProgramId,
        ) as TClinicianProgram);

    if (!selectedProgram) {
      console.error("Client error: ", clinicianId, client.clinicianClientId);
      throw new Error("Program not found");
    }
    // Create client program version
    const updatedProgram = _createClientProgramVersion(client, selectedProgram);
    const updatedClient = _updateClient(client, updatedProgram);

    await Promise.all([
      !hasEuneoProgram &&
        createModifiedClinicianProgramVersion(
          updatedProgram,
          updatedProgram.phases,
          updatedProgram.days,
          (updatedClient.clientProgram as TClientClinicianProgram)
            .clinicianProgramId,
          clinicianId,
        ),
      setClientProgramVersion(
        updatedClient.prescription!.clientId as string,
        updatedClient.clientProgram as TClientProgram,
        updatedProgram,
        clinicianId,
        client.clinicianClientId,
        updatedProgram.version,
        true,
      ),
    ]).catch((error) => {
      console.error(
        "Error on client document: ",
        client.clinicianClientId,
        error,
      );
      throw new Error(error);
    });
  } else if (client.prescription) {
    const clinicianClientRef = doc(
      db,
      "clinicians",
      clinicianId,
      "clients",
      client.clinicianClientId,
    ) as DocumentReference<TClientWrite>;
    const prescriptionConverted = prescriptionConverter.toFirestore({
      ...client.prescription,
      version: client.prescription.version || "1.0",
    });
    await updateDoc(clinicianClientRef, {
      "prescription.programRef": prescriptionConverted.programRef,
    });
  }
}

/**
 * @description deprecated? // TODO: Explain what this function does, examples are great
 */
async function upgradeClientPastPrescription(
  clinicianId: string,
  client: TClinicianClient,
  clinicianPrograms: TClinicianProgram[],
  euneoPrograms: TEuneoProgram[],
) {
  const pastPrescriptions = await getDeprecatedClinicianClientPastPrescriptions(
    clinicianId,
    client.clinicianClientId,
  );

  if (pastPrescriptions && pastPrescriptions.length > 0) {
    const updatedPastPrograms = await Promise.all(
      pastPrescriptions
        .filter((p) => !p.version)
        .map(async (prescriptionData) => {
          const { id, ...prescription } = prescriptionData;
          if (prescription.status === "Started") {
            const clientProgram = await getDeprecatedClientProgram(
              prescription.clientId!,
              prescription.clientProgramId!,
            );
            const hasEuneoProgram = "euneoProgramId" in clientProgram;
            const selectedProgram = hasEuneoProgram
              ? (euneoPrograms.find(
                  (program) =>
                    program.euneoProgramId ===
                    (clientProgram as TClientEuneoProgram).euneoProgramId,
                ) as TEuneoProgram)
              : (clinicianPrograms.find(
                  (program) =>
                    program.clinicianProgramId ===
                    (clientProgram as TClientClinicianProgram)
                      .clinicianProgramId,
                ) as TClinicianProgram);
            if (!selectedProgram) {
              throw new Error("Program not found");
            }

            const updatedPastProgram = _createClientProgramVersion(
              client,
              selectedProgram,
            );

            const newVersion = createModifiedVersion("1.0");
            const upgradedPastClientProgram = _upgradeClientProgram(
              clientProgram,
              newVersion,
            );
            await Promise.all([
              !hasEuneoProgram &&
                createModifiedClinicianProgramVersion(
                  updatedPastProgram,
                  updatedPastProgram.phases,
                  updatedPastProgram.days,
                  (clientProgram as TClientClinicianProgram).clinicianProgramId,
                  clinicianId,
                ),
              updatePastClientProgram(
                prescription.clientId!,
                upgradedPastClientProgram,
              ),
              updatePastPrescription(
                clinicianId,
                client.clinicianClientId,
                prescription,
                id,
                newVersion,
              ),
            ]).catch((err) => {
              console.error(
                "Error on client document: ",
                client.clinicianClientId,
                err,
              );
              throw new Error(err);
            });

            return updatedPastProgram;
          } else {
            await removeClinicianClientPastPrescription(
              clinicianId,
              client.clinicianClientId,
              id,
            );
          }
        }),
    );
  }
}

/**
 * @description deprecated? // TODO: Explain what this function does, examples are great
 */
export async function upgradePrescriptions(
  clinicianId: string,
  clients: TClinicianClient[],
  clinicianPrograms: TClinicianProgram[],
  euneoPrograms: TEuneoProgram[],
) {
  await Promise.all(
    clients.map(async (client) => {
      await Promise.all([
        upgradeClinicianClientCurrentPrescription(
          clinicianId,
          client,
          clinicianPrograms,
          euneoPrograms,
        ),
        upgradeClientPastPrescription(
          clinicianId,
          client,
          clinicianPrograms,
          euneoPrograms,
        ),
      ]);
    }),
  );
}
