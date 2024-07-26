import { updateDoc } from "../updateDoc";
import { TInvitation } from "../../entities/invitation/invitation";

export function updateInvitation(
  // TODO: this is dumd, should take in ref and data to update
  updatedInvitation: TInvitation,
): Promise<void> {
  return updateDoc(updatedInvitation.invitationRef, {
    date: updatedInvitation.date,
    code: updatedInvitation.code,
  });
}
