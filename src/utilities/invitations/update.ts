import { TInvitation } from "../../types/clinicianTypes";
import { updateDoc } from "../updateDoc";
import { createInvitationRef } from "../../entities/invitation/invitation";

export function updateInvitation(
  updatedInvitation: TInvitation
): Promise<void> {
  const invitationRef = createInvitationRef({
    invitations: updatedInvitation.invitationId,
  });

  return updateDoc(invitationRef, {
    date: updatedInvitation.date,
    code: updatedInvitation.code,
  });
}
