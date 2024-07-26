import { deleteDoc, doc } from "firebase/firestore";
import { TClientProgramRef } from "../../../entities/client/clientProgram";

export async function removeDaysFromClientProgram(
  clientProgramRef: TClientProgramRef,

  firstDocIndex: number,
  numberOfDays: number,
) {
  // Update days documents
  const tempArr = Array.from(
    { length: numberOfDays },
    (_, i) => i + firstDocIndex,
  );

  await Promise.all(
    tempArr.map((dayIndex) => {
      const dayCol = doc(clientProgramRef, "days", dayIndex.toString());
      return deleteDoc(dayCol);
    }),
  );
}
