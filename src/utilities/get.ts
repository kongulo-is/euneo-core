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
