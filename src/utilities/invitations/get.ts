import {
  collection,
  where,
  doc,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TInvitation } from "../../types/clinicianTypes";

export function getProgramCode(
  clinicianId: string,
  clinicianClientId: string
): Promise<TInvitation> {
  let invitation: TInvitation = {
    invitationId: "",
    code: "",
    date: new Date(),
  };
  // query the database for the invitation code
  const invitationRef = collection(db, "invitations");
  const q = query(
    invitationRef,
    orderBy("date", "desc"), // assumes the field is named 'date' and we're sorting in descending order
    where(
      "clinicianClientRef",
      "==",
      doc(db, "clinicians", clinicianId, "clients", clinicianClientId)
    )
  );

  return getDocs(q).then((querySnapshot) => {
    const [newestDoc] = querySnapshot.docs; // destructuring to get the first doc

    if (newestDoc) {
      const data = newestDoc.data();
      invitation.invitationId = newestDoc.id;
      invitation.code = data.code;
      invitation.date = data.date.toDate();
      return invitation; // Assumes code is a string. Format it here if necessary.
    }

    return invitation; // return an empty string if no documents were found
  });
}
