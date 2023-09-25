import {
  DocumentReference,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { TEuneoProgramId } from "../types/baseTypes";
import {
  TProgramWrite,
  TProgram,
  TPhaseProgram,
  TContinuousProgram,
} from "../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "./converters";

export async function _fetchProgramBase(
  programRef: DocumentReference<TProgramWrite>
) {
  const programSnap = await getDoc(programRef.withConverter(programConverter));
  if (!programSnap.exists()) {
    throw new Error("Program does not exist.");
  }
  const programData = programSnap.data();
  return programData;
}

export async function _fetchDays(programRef: DocumentReference) {
  const daySnapshots = await getDocs(
    collection(programRef, "days").withConverter(programDayConverter)
  );

  return Object.fromEntries(
    daySnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

export async function _fetchPhases(programRef: DocumentReference) {
  const phaseSnapshots = await getDocs(
    collection(programRef, "phases").withConverter(programPhaseConverter)
  );
  return Object.fromEntries(
    phaseSnapshots.docs.map((doc) => [doc.id, doc.data()])
  );
}

export async function _getProgramFromRef(
  programRef: DocumentReference<TProgramWrite>
): Promise<TProgram> {
  const [programBase, days] = await Promise.all([
    _fetchProgramBase(programRef),
    _fetchDays(programRef),
  ]);

  const programId = programRef.id;

  let programMode: TPhaseProgram | TContinuousProgram;

  if (programBase.mode === "phase") {
    const phases = await _fetchPhases(programRef);
    programMode = { ...programBase, days, phases, mode: "phase" };
  } else {
    programMode = { ...programBase, days, mode: "continuous" };
  }

  let program: TProgram;

  if (programRef.parent.parent) {
    program = {
      ...programMode,
      mode: "continuous",
      physioId: programRef.parent.parent.id,
      physioProgramId: programId,
    };
    return program;
  } else {
    return { ...programMode, euneoProgramId: programId as TEuneoProgramId };
  }
}
