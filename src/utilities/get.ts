import {
  CollectionReference,
  DocumentReference,
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/db";
import {
  TExercise,
  TExerciseWrite,
  TOutcomeMeasure,
  TOutcomeMeasureWrite,
} from "../types/baseTypes";
import { TPhysio } from "../types/physioTypes";

export async function getClient(uid: string) {
  const userRef = doc(db, "clients", uid);

  const userDoc = await getDoc(userRef);

  console.log("userDoc.data()", userDoc.data());

  const userData = {
    ...userDoc.data(),
    uid: uid,
  };

  return userData;
}

export async function getPhysio(uid: string): Promise<TPhysio> {
  try {
    const physioRef = doc(db, "physios", uid) as DocumentReference<TPhysio>;

    const physioDoc = await getDoc(physioRef);

    const physio = physioDoc.data();

    if (!physio) throw new Error("No physio found");

    return physio;
  } catch (error) {
    console.error("Error fetching physio", error, { uid });
    throw error;
  }
}
