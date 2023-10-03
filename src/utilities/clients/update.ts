import { DocumentReference, doc } from "firebase/firestore";
import { TClientPreferences, TClientWrite } from "../../types/clientTypes";
import { db } from "../../firebase/db";
import { updateDoc } from "../updateDoc";

export const updateClientPreference = async (
  clientId: string,
  oldPreferences: TClientPreferences,
  preferenceKey: keyof TClientPreferences,
  preferenceValue: TClientPreferences[keyof TClientPreferences]
) => {
  const clientRef = doc(
    db,
    "clients",
    clientId
  ) as DocumentReference<TClientWrite>;

  await updateDoc(clientRef, {
    preferences: {
      ...oldPreferences,
      [preferenceKey]: preferenceValue,
    },
  });
};
