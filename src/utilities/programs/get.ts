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
import { TInvitationWrite, TPhysioClientWrite } from "../../types/physioTypes";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramWrite,
} from "../../types/programTypes";
import { _getProgramFromRef } from "../programHelpers";
import runtimeChecks from "../runtimeChecks";
import { TEuneoProgramId } from "../../types/baseTypes";
import { updateDoc } from "../updateDoc";

export async function getProgramFromCode(code: string): Promise<{
  program: TPhysioProgram | TEuneoProgram;
  physioClientRef: DocumentReference<TPhysioClientWrite, DocumentData>;
}> {
  // We dont need a converter here because it would not convert anything
  const q = query(collection(db, "invitations"), where("code", "==", code));

  const querySnapshot = (await getDocs(q)) as QuerySnapshot<TInvitationWrite>;

  if (querySnapshot.empty) {
    console.log("No matching invitation found.");
    throw new Error("No matching invitation found.");
  }

  const firstDoc = querySnapshot.docs[0];
  const { physioClientRef } = firstDoc.data();

  const physioClientDoc = await getDoc(physioClientRef);
  const physioClientData = physioClientDoc.data();

  if (!physioClientData || !physioClientData.prescription) {
    // TDOD: handle error client side
    throw new Error("Prescription not found for the given PhysioClient");
  }

  const { programRef } = physioClientData.prescription;
  const program = (await _getProgramFromRef(programRef)) as TPhysioProgram;

  runtimeChecks.assertTPhysioProgram(program);

  // update physio clientProgramRef
  await updateDoc(physioClientRef, {
    prescription: {
      ...physioClientData.prescription,
      status: "Accepted",
    },
  });

  return { program, physioClientRef };
}

export async function getAllEuneoPrograms(): Promise<TEuneoProgram[]> {
  const euneoPrograms: TEuneoProgram[] = [];

  const ref = collection(
    db,
    "testPrograms"
  ) as CollectionReference<TProgramWrite>;

  const query = await getDocs(collection(db, "testPrograms"));

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

  console.log("euneoPrograms", euneoPrograms);

  return euneoPrograms;
}

// TODO: Breyta testPrograms í programs þegar við erum búnir að uppfæra db
export async function getEuneoProgramWithDays(
  euneoProgramId: TEuneoProgramId
): Promise<TEuneoProgram> {
  let programRef = doc(
    db,
    "testPrograms",
    euneoProgramId
  ) as DocumentReference<TProgramWrite>;
  console.log("hi");

  const euneoProgram = await _getProgramFromRef(programRef);

  if (!("euneoProgramId" in euneoProgram)) {
    throw new Error("Program is not an euneo program");
  }

  return euneoProgram;
}
