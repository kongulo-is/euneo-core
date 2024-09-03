import {
  collection,
  where,
  doc,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import {
  deserializeInvitationPath,
  invitationConverter,
  TInvitation,
} from "../../entities/invitation/invitation";
import { createClinicianClientRef } from "../../entities/clinician/clinicianClient";

/**
 * @description Get program invitation from code
 * @param code Code that client submitted
 * @returns Object depending on whether it was successful or not
 */
export async function getInvitationFromCode(
  code: string
): Promise<
  { data: TInvitation; success: true } | { data: null; success: false }
> {
  try {
    // TODO: vantar að laga invitation converterinn þá þarf ekki að hafa þetta withConverter útum allt
    const invitationCollectionRef = collection(db, "invitations").withConverter(
      invitationConverter
    );

    // We dont need a converter here because it would not convert anything
    const q = query(invitationCollectionRef, where("code", "==", code));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) throw new Error("No matching invitation found.");

    const invitationSnapshot = querySnapshot.docs[0];
    const invitationRead = invitationSnapshot.data();

    const invitation: TInvitation = {
      ...invitationRead,
      invitationRef: invitationSnapshot.ref,
      invitationIdentifiers: deserializeInvitationPath(
        invitationSnapshot.ref.path
      ),
    };

    return {
      data: invitation,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
    };
  }
}

export function getProgramCode(
  clinicianId: string,
  clinicianClientId: string
): Promise<TInvitation | undefined> {
  const clinicianClientRef = createClinicianClientRef({
    clinicians: clinicianId,
    clients: clinicianClientId,
  });

  // query the database for the invitation code
  const invitationRef = collection(db, "invitations").withConverter(
    invitationConverter
  );
  const q = query(
    invitationRef,
    orderBy("date", "desc"), // assumes the field is named 'date' and we're sorting in descending order
    where("clinicianClientRef", "==", clinicianClientRef)
  );

  return getDocs(q).then((querySnapshot) => {
    const [newestDoc] = querySnapshot.docs; // destructuring to get the first doc

    if (newestDoc) {
      const data = newestDoc.data();

      const invitation = {
        ...data,
        invitationRef: newestDoc.ref,
        invitationIdentifiers: deserializeInvitationPath(newestDoc.ref.path),
      };

      return invitation; // Assumes code is a string. Format it here if necessary.
    }
    console.error("No invitation found");
    return;
  });
}
