import { DocumentReference, doc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TInvitation, TInvitationWrite } from "../../types/clinicianTypes";
import { updateDoc } from "../updateDoc";

export function updateInvitation(
  updatedInvitation: TInvitation
): Promise<void> {
  // query the database for the invitation code
  const invitationRef = doc(
    db,
    "invitations",
    updatedInvitation.invitationId
  ) as DocumentReference<TInvitationWrite>;

  return updateDoc(invitationRef, {
    date: updatedInvitation.date,
    code: updatedInvitation.code,
  });
}
