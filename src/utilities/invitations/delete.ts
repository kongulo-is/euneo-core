import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/db";

// remove invitation
export async function removeInvitation(code: string) {
  const invitationRef = collection(db, "invitations");
  const q = query(invitationRef, where("code", "==", code));
  const querySnapshot = await getDocs(q);
  const docId = querySnapshot.docs[0].id;
  console.log("INVITATION DOC ID to DELETE:", docId);
  const docRef = doc(db, "invitations", docId);
  await deleteDoc(docRef);
  console.log("INVITATION DELETED");
}
