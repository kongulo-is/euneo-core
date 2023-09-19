import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/db";

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
