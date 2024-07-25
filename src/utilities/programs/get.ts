import {
  query,
  collection,
  where,
  getDocs,
  QuerySnapshot,
  getDoc,
  DocumentReference,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TInvitationWrite } from "../../types/clinicianTypes";

import { _getProgramFromRef } from "../programHelpers";
import { updateDoc } from "../updateDoc";
import {
  TClinicianProgram,
  TEuneoProgram,
  TProgram,
  TProgramRead,
  TProgramWrite,
  programConverter,
} from "../../entities/program/program";
import { TProgramPhaseKey } from "../../entities/program/programPhase";
import { TProgramDayKey } from "../../entities/program/programDay";
import {
  TProgramVersionRead,
  TProgramVersionWrite,
} from "../../entities/program/version";
import { TClinicianClientRef } from "../../entities/clinician/clinicianClient";

/**
 * @description Get program from code in app
 */
// TODO: Fix function
export async function getProgramFromCode(code: string): Promise<{
  program: TClinicianProgram | TEuneoProgram;
  clinicianClientRef: TClinicianClientRef;
  clinicianId: string;
  invitationId: string;
}> {
  // We dont need a converter here because it would not convert anything
  const q = query(collection(db, "invitations"), where("code", "==", code));

  const querySnapshot = (await getDocs(q)) as QuerySnapshot<TInvitationWrite>;

  if (querySnapshot.empty) {
    console.log("No matching invitation found.");
    throw new Error("No matching invitation found.");
  }

  const firstDoc = querySnapshot.docs[0];
  const { clinicianClientRef } = firstDoc.data();

  const clinicianClientDoc = await getDoc(clinicianClientRef);
  const clinicianClientData = clinicianClientDoc.data();

  if (!clinicianClientData || !clinicianClientData.prescription) {
    // TDOD: handle error client side
    throw new Error("Prescription not found for the given ClinicianClient");
  }

  const { programRef } = clinicianClientData.prescription;
  const program = await _getProgramFromRef(programRef);

  Object.keys(program.phases).forEach((key) => {
    if (key.includes("_") && !key.includes(clinicianClientRef.id)) {
      delete program.phases[key as TProgramPhaseKey];
    }
  });

  Object.keys(program.days).forEach((key) => {
    if (key.includes("_") && !key.includes(clinicianClientRef.id)) {
      delete program.days[key as TProgramDayKey];
    }
  });

  const clinicianId = clinicianClientRef.parent.parent!.id;
  const invitationId = firstDoc.id;

  // runtimeChecks.assertTClinicianProgram(program);

  // update clinician clientProgramRef
  await updateDoc(clinicianClientRef, {
    prescription: {
      ...clinicianClientData.prescription,
      status: "Accepted",
    },
  });

  return { program, clinicianClientRef, clinicianId, invitationId };
}

export async function getAllEuneoPrograms(
  filter: "isConsoleLive" | "isLive" | "",
  excludeMaintenance: boolean = false,
  shouldUpgradeOnError: boolean = false // TODO: remove this?
): Promise<TEuneoProgram[]> {
  const programsRef = collection(db, "programs");

  let programsSnap: QuerySnapshot<TProgramRead, TProgramWrite>;
  if (filter) {
    const programsQuery = query(programsRef, where(filter, "==", true));
    programsSnap = await getDocs(programsQuery.withConverter(programConverter));
  } else {
    programsSnap = await getDocs(programsRef.withConverter(programConverter));
  }

  const programsData = programsSnap.docs.map((doc) => doc.data());

  console.log("PROGRAMS DATA", programsData);

  const programs = Promise.all(
    programsData.map(async (p) => {
      const { currentVersionRef } = p;
      const program = await _getProgramFromRef(
        currentVersionRef,
        excludeMaintenance
      );
      if (program.creator !== "euneo") {
        throw new Error("Program is not a euneo program, invalid program");
      }
      return program;
    })
  );
  console.log("PROGRAMS", programs);

  return programs;
}

/**
 * @deprecated // TODO: remove this?
 */
export async function getEuneoProgramWithDays(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  excludeMaintenance: boolean = false
): Promise<TEuneoProgram> {
  const euneoProgram = await _getProgramFromRef(
    programVersionRef,
    excludeMaintenance
  );

  if (!(euneoProgram.creator === "euneo")) {
    throw new Error("Program is not an euneo program");
  }

  return euneoProgram;
}

/**
 * @description Use this function if it does not matter which program type it is
 * @returns TProgram
 */
export async function getProgram(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >,
  excludeMaintenance: boolean = false
): Promise<TProgram> {
  const program = await _getProgramFromRef(
    programVersionRef,
    excludeMaintenance
  );

  return program;
}
