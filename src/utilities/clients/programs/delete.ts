import { DocumentReference, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase/db";
import { TClientProgramWrite } from "../../../types/clientTypes";

export async function removeDaysFromClientProgram(
  clientId: string,
  clientProgramId: string,
  firstDocIndex: number,
  numberOfDays: number
) {
  const programRef = doc(
    db,
    "clients",
    clientId,
    "programs",
    clientProgramId
  ) as DocumentReference<TClientProgramWrite>;
  // Update days documents
  const tempArr = Array.from(
    { length: numberOfDays },
    (_, i) => i + firstDocIndex
  );
  console.log("tempArr", tempArr);

  await Promise.all(
    tempArr.map((dayIndex) => {
      const dayCol = doc(programRef, "days", dayIndex.toString());
      return deleteDoc(dayCol);
    })
  );
}
