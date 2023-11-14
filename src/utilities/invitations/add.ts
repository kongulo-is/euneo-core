import { addDoc, collection, doc } from "firebase/firestore";
import { db } from "../../firebase/db";

export async function createInvitation(
  cliniciansId: string,
  clinicianClientId: string
) {
  const clinicianClientRef = doc(
    db,
    "clinicians",
    cliniciansId,
    "clients",
    clinicianClientId
  );
  // Create invitation for client
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const invitationRef = collection(db, "invitations");
  console.log("CODE", code);

  await addDoc(invitationRef, {
    clinicianClientRef,
    code,
    date: new Date(),
  });
}
