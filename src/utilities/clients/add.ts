import { DocumentReference, doc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClientPreferences, TClientWrite } from "../../types/clientTypes";
import { updateDoc } from "../updateDoc";

export const addClientPreferences = async (
  clientId: string,
  preferences: TClientPreferences
) => {
  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<TClientWrite>;

  await updateDoc(clientRef, {
    preferences,
  });
};
