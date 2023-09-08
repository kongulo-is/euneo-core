import {
  physioProgramConverter,
  dayConverter,
  physioClientConverter,
} from "./converters";
import {
  EuneoProgramWrite,
  InvitationWrite,
  PhysioClientWrite,
  PhysioProgramWrite,
} from "../types/converterTypes";
import {
  TPhysioProgram,
  TEuneoProgram,
  TProgramPath,
  TProgramDay,
} from "../types/datatypes";
import {
  DocumentReference,
  Firestore,
  QuerySnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

async function _getProgramFromRef(
  db: Firestore,
  programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>
): Promise<TPhysioProgram | TEuneoProgram> {
  // Fetch program data using the determined programRef
  const programSnap = await getDoc(
    programRef.withConverter(physioProgramConverter(db))
  );
  const program = programSnap.data();

  // Fetch days
  const daysQuery = collection(programRef, "days").withConverter(
    dayConverter(db)
  );
  const daySnapshots = await getDocs(daysQuery);
  const daysList = daySnapshots.docs.map((doc) => doc.data());

  const programData: TPhysioProgram = {
    ...program,
    days: daysList,
  };

  // Merge and return
  return programData;
}

/**
 *
 * @param programRef
 * @param db
 * @returns
 */
export async function getProgramWithDays(
  db: Firestore,
  programPath: TProgramPath
): Promise<TPhysioProgram | TEuneoProgram> {
  let programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>;

  // Determine if it's a program or a physio program based on the path format
  const parts = programPath.split("/");
  if (parts.length === 2) {
    // It's a program ID
    programRef = doc(db, programPath) as DocumentReference<EuneoProgramWrite>;
  } else if (parts.length === 4) {
    // It's a physio program ID
    programRef = doc(db, programPath) as DocumentReference<PhysioProgramWrite>;
  } else {
    throw new Error("Invalid program path format");
  }

  return _getProgramFromRef(db, programRef);
}

export async function getProgramFromCode(
  db: Firestore,
  code: string
): Promise<TPhysioProgram | TEuneoProgram> {
  console.log("EUNEO-TYPES-DEBUGGER1", db);

  // We dont need a converter here because it would not convert anything
  const q = query(collection(db, "invitations"), where("code", "==", code));
  console.log("EUNEO-TYPES-DEBUGGER", q);

  const querySnapshot = (await getDocs(q)) as QuerySnapshot<InvitationWrite>;

  if (querySnapshot.empty) {
    console.log("No matching invitation found.");
    throw new Error("No matching invitation found.");
  }

  const firstDoc = querySnapshot.docs[0];

  const { physioClientRef } = firstDoc.data();

  console.log("physioRef", physioClientRef, physioClientRef.id);

  const physioClientDoc = await getDoc(physioClientRef);

  const physioClientData = physioClientDoc.data();

  if (!physioClientData || !physioClientData.prescription) {
    // TDOD: handle error client side
    throw new Error("Prescription not found for the given PhysioClient");
  }

  const { programRef } = physioClientData.prescription;

  // TODO: delete the invitation from db

  const program = await _getProgramFromRef(db, programRef);

  return program;
}
