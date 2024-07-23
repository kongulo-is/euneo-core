import { addDoc, collection, doc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClinicianClientRef } from "../../entities/clinician/clinicianClient";

export async function createInvitation(
  clinicianClientRef: TClinicianClientRef,
  code: string,
) {
  // Create invitation for client
  const invitationsRef = collection(db, "invitations");

  const invitationRef = await addDoc(invitationsRef, {
    clinicianClientRef,
    code,
    date: new Date(),
  });

  return invitationRef.id;
}
