import { updateDoc } from "../updateDoc";
import { TInvitation } from "../../entities/invitation/invitation";

export async function updateInvitation(
  updatedInvitation: TInvitation
): Promise<void> {
  return await updateDoc(updatedInvitation.invitationRef, {
    date: updatedInvitation.date,
    code: updatedInvitation.code,
  });
}
