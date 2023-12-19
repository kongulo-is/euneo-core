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
  const invitationRef = collection(db, "invitations");

  await addDoc(invitationRef, {
    clinicianClientRef,
    code,
    date: new Date(),
  });
}
