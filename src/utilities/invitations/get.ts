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

export function getProgramCode(
  clinicianId: string,
  clinicianClientId: string
): Promise<TInvitation> {
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
    throw new Error("No invitation found");
  });
}
