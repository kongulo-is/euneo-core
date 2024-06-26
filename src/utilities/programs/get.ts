import {
  query,
  collection,
  where,
  getDocs,
  QuerySnapshot,
  getDoc,
  DocumentReference,
  doc,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import {
  TInvitationWrite,
  TClinicianClientWrite,
} from "../../types/clinicianTypes";
import {
  TClinicianProgram,
  TEuneoProgram,
  TProgramDayKey,
  TProgramPhaseKey,
  TProgramVersionWrite,
  TProgramWrite,
} from "../../types/programTypes";
import { _getProgramFromRef } from "../programHelpers";
import runtimeChecks from "../runtimeChecks";
import { TEuneoProgramId } from "../../types/baseTypes";
import { updateDoc } from "../updateDoc";
import { upgradeDeprecatedProgram } from "./update";

export async function getProgramFromCode(code: string): Promise<{
  program: TClinicianProgram | TEuneoProgram;
  clinicianClientRef: DocumentReference<TClinicianClientWrite, DocumentData>;
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
  shouldUpgradeOnError: boolean = false
): Promise<TEuneoProgram[]> {
  const euneoPrograms: TEuneoProgram[] = [];

  const programsRef = collection(
    db,
    "programs"
  ) as CollectionReference<TProgramVersionWrite>;

  let querySnapshot: QuerySnapshot<TProgramVersionWrite, DocumentData>;
  if (filter) {
    querySnapshot = await getDocs(
      query(programsRef, where(filter, "==", true))
    );
  } else {
    querySnapshot = await getDocs(programsRef);
  }

  // map and _getProgramFromRef for each program
  const programs = querySnapshot.docs.map((programSnap) => {
    try {
      const programData = programSnap.data();
      const currentVersion = programData.currentVersion.id;
      const programRef = doc(
        programSnap.ref,
        "versions",
        currentVersion
      ) as DocumentReference<TProgramWrite>;
      return _getProgramFromRef(programRef, excludeMaintenance);
    } catch (error) {
      // Doing as any because the type we think it is is TProgramVersionWrite but it is in fact TProgramWrite
      if (shouldUpgradeOnError) {
        return upgradeDeprecatedProgram(programSnap.ref as any);
      }
      return [];
    }
  });

  const resolvedPrograms = await Promise.all(programs);

  resolvedPrograms.forEach((program) => {
    if ("euneoProgramId" in program) {
      euneoPrograms.push(program);
    }
  });

  return euneoPrograms;
}

export async function getEuneoProgramWithDays(
  euneoProgramId: TEuneoProgramId,
  version: string = "1.0",
  excludeMaintenance: boolean = false
): Promise<TEuneoProgram> {
  let programRef = doc(
    db,
    "programs",
    euneoProgramId,
    "versions",
    version
  ) as DocumentReference<TProgramWrite>;
  const euneoProgram = await _getProgramFromRef(programRef, excludeMaintenance);

  if (!("euneoProgramId" in euneoProgram)) {
    throw new Error("Program is not an euneo program");
  }

  return euneoProgram;
}
