import {
  collection,
  where,
  doc,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { get } from "http";

export function getProgramCode(
  cliniciansId: string,
  clinicianClientId: string
) {
  // query the database for the invitation code
  const invitationRef = collection(db, "invitations");
  const q = query(
    invitationRef,
    orderBy("date", "desc"), // assumes the field is named 'date' and we're sorting in descending order
    where(
      "clinicianClientRef",
      "==",
      doc(db, "clinicians", cliniciansId, "clients", clinicianClientId)
    )
  );

  return getDocs(q).then((querySnapshot) => {
    const [newestDoc] = querySnapshot.docs; // destructuring to get the first doc
    console.log("QUERY, ", querySnapshot);

    if (newestDoc) {
      console.log(newestDoc.id, " => ", newestDoc.data());
      const code = newestDoc.data().code;
      return code; // Assumes code is a string. Format it here if necessary.
    }

    return ""; // return an empty string if no documents were found
  });
}
