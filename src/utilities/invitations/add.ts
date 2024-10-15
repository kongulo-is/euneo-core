import { setDoc } from "firebase/firestore";
import {
  deserializeClinicianClientPath,
  TClinicianClientRef,
} from "../../entities/clinician/clinicianClient";
import {
  createInvitationRef,
  deserializeInvitationPath,
  TInvitation,
  TInvitationRead,
} from "../../entities/invitation/invitation";

export async function createInvitation(
  clinicianClientRef: TClinicianClientRef,
  code: string,
  clinicianName?: string,
  oneMonthFree?: boolean
): Promise<TInvitation> {
  // Create invitation for client
  const invitationRef = createInvitationRef();

  const invitation: TInvitationRead = {
    clinicianClientRef,
    clinicianClientIdentifiers: deserializeClinicianClientPath(
      clinicianClientRef.path
    ),
    code,
    date: new Date(),
    ...(oneMonthFree && { oneMonthFree }),
    ...(clinicianName && { clinicianName }),
  };

  await setDoc(invitationRef, invitation);

  return {
    ...invitation,
    invitationRef,
    invitationIdentifiers: deserializeInvitationPath(invitationRef.path),
  };
}
