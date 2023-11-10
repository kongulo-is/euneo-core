import { addDoc, collection, doc } from "firebase/firestore";
import { db } from "../../firebase/db";

export async function createInvitation(
  physioId: string,
  physioClientId: string
) {
  const physioClientRef = doc(
    db,
    "clinicians",
    physioId,
    "clients",
    physioClientId
  );
  // Create invitation for client
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const invitationRef = collection(db, "invitations");
  console.log("CODE", code);

  await addDoc(invitationRef, {
    physioClientRef,
    code,
    date: new Date(),
  });
}
