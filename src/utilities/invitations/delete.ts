import {
  DocumentReference,
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

  const docRef = doc(db, "invitations", docId);
  await deleteDoc(docRef);
}

// TODO: TEMPORARY - Remove all invitations for a list of clinicians
export async function clearInvitations(clinicians: string[]) {
  const invitations: DocumentReference[] = [];
  const invitationsToDelete: DocumentReference[] = [];
  const invitationRef = collection(db, "invitations");
  const data = await getDocs(query(invitationRef));

  data.forEach((doc) => {
    const path = doc.data().clinicianClientRef.path;
    if (
      clinicians.some((c) => {
        return path.includes(c);
      })
    ) {
      console.log(doc.data().clinicianClientRef.path);
      invitations.push(doc.ref);
    } else {
      invitationsToDelete.push(doc.ref);
    }
  });

  console.log("To delete", invitationsToDelete);
  console.log("To keep", invitations);

  // Delete
  invitationsToDelete.forEach(async (i) => {
    await deleteDoc(i);
  });

  return invitations;
}
