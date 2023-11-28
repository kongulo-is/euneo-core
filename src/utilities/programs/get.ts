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
  TProgramWrite,
} from "../../types/programTypes";
import { _getProgramFromRef } from "../programHelpers";
import runtimeChecks from "../runtimeChecks";
import { TEuneoProgramId } from "../../types/baseTypes";
import { updateDoc } from "../updateDoc";

export async function getProgramFromCode(code: string): Promise<{
  program: TClinicianProgram | TEuneoProgram;
  clinicianClientRef: DocumentReference<TClinicianClientWrite, DocumentData>;
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

  // runtimeChecks.assertTClinicianProgram(program);

  // update clinician clientProgramRef
  await updateDoc(clinicianClientRef, {
    prescription: {
      ...clinicianClientData.prescription,
      status: "Accepted",
    },
  });

  return { program, clinicianClientRef };
}

export async function getAllEuneoPrograms(): Promise<TEuneoProgram[]> {
  const euneoPrograms: TEuneoProgram[] = [];

  const ref = collection(db, "programs") as CollectionReference<TProgramWrite>;

  const query = await getDocs(collection(db, "programs"));

  // map and _getProgramFromRef for each program
  const programs = query.docs.map((doc) => {
    const ref = doc.ref as DocumentReference<TProgramWrite>;
    return _getProgramFromRef(ref);
  });

  const resolvedPrograms = await Promise.all(programs);

  resolvedPrograms.forEach((program) => {
    if ("euneoProgramId" in program) {
      euneoPrograms.push(program);
    }
  });

  return euneoPrograms;
}

// TODO: Breyta programs í programs þegar við erum búnir að uppfæra db
export async function getEuneoProgramWithDays(
  euneoProgramId: TEuneoProgramId
): Promise<TEuneoProgram> {
  let programRef = doc(
    db,
    "programs",
    euneoProgramId
  ) as DocumentReference<TProgramWrite>;

  const euneoProgram = await _getProgramFromRef(programRef);

  if (!("euneoProgramId" in euneoProgram)) {
    throw new Error("Program is not an euneo program");
  }

  return euneoProgram;
}
