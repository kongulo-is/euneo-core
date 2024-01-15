import { addDoc, collection, doc } from "firebase/firestore";
import { db } from "../../firebase/db";

export async function createInvitation(
  clinicianId: string,
  clinicianClientId: string,
  code: string
) {
  const clinicianClientRef = doc(
    db,
    "clinicians",
    clinicianId,
    "clients",
    clinicianClientId
  );
  // Create invitation for client
  const invitationsRef = collection(db, "invitations");

  const invitationRef = await addDoc(invitationsRef, {
    clinicianClientRef,
    code,
    date: new Date(),
  });

  return invitationRef.id;
}
