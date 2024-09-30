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

import {
  _getProgramDetailsFromRef,
  _getProgramFromRef,
} from "../programHelpers";
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
import {
  deserializeInvitationPath,
  invitationConverter,
  TInvitation,
} from "../../entities/invitation/invitation";
import { prescriptionConverter } from "../../entities/clinician/prescription";

/**
 * @description Get program from code in app
 * @deprecated Breaking this function down into smaller functions
 */
// TODO: Fix function
export async function getProgramFromCode(code: string): Promise<{
  program: TClinicianProgram | TEuneoProgram;
  clinicianClientRef: TClinicianClientRef;
  clinicianId: string;
  invitationId: string;
}> {
  const invitationCollectionRef = collection(db, "invitations").withConverter(
    invitationConverter
  );

  // We dont need a converter here because it would not convert anything
  const q = query(invitationCollectionRef, where("code", "==", code));

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) throw new Error("No matching invitation found.");

  // TODO: vantar að laga invitation converterinn þá þarf ekki að hafa þetta withConverter útum allt
  const firstDoc = querySnapshot.docs[0];
  const { clinicianClientRef } = firstDoc.data();

  const clinicianClientDoc = await getDoc(clinicianClientRef);
  const clinicianClientData = clinicianClientDoc.data();

  if (!clinicianClientData || !clinicianClientData.prescription) {
    // TDOD: handle error client side
    throw new Error("Prescription not found for the given ClinicianClient");
  }

  const { programVersionRef } = clinicianClientData.prescription;

  const program = await _getProgramFromRef(programVersionRef);

  // TODO: what does this do?
  Object.keys(program.phases).forEach((key) => {
    if (key.includes("_") && !key.includes(clinicianClientRef.id)) {
      delete program.phases[key as TProgramPhaseKey];
    }
  });

  // TODO: what does this do?
  Object.keys(program.days).forEach((key) => {
    if (key.includes("_") && !key.includes(clinicianClientRef.id)) {
      delete program.days[key as TProgramDayKey];
    }
  });

  const clinicianId = clinicianClientRef.parent.parent!.id;
  const invitationId = firstDoc.id;

  // runtimeChecks.assertTClinicianProgram(program);

  const presctiptionWrite = prescriptionConverter.toFirestore(
    clinicianClientData.prescription
  );

  // TODO: Færa þetta þannig það sé kallað á í /prescription í core
  // update clinician clientProgramRef
  await updateDoc(clinicianClientRef, {
    prescription: {
      ...presctiptionWrite,
      status: "Accepted",
    },
  });

  return {
    program,
    clinicianClientRef: clinicianClientRef,
    clinicianId,
    invitationId,
  };
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

/**
 * @description Use this function if it does not matter which program type it is
 * @returns TProgram
 * TODO: this was a quick fix
 */
export async function getProgramDetails(
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >
) {
  const program = await _getProgramDetailsFromRef(programVersionRef);

  return program;
}
