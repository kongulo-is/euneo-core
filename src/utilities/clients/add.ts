import { DocumentReference, Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/db";
import {
  TClient,
  TClientPreferences,
  TClientProgram,
  TClientWrite,
} from "../../types/clientTypes";
import { updateDoc } from "../updateDoc";
import {
  clientProgramConverter,
  clientProgramDayConverter,
} from "../converters";

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

export async function createClientDocument(
  clientId: string,
  name: string,
  platform: string
) {
  try {
    const clientRef = doc(db, "clients", clientId);
    await setDoc(clientRef, {
      name,
      platform,
    });
  } catch (error) {
    console.error("Error creating client document: ", error, {
      clientId,
      name,
    });
    throw error;
  }
}

export async function createDuplicateDocument(
  newClientId: string,
  client: TClient,
  clientProgram: TClientProgram
) {
  try {
    const clientRef = doc(db, "clients", newClientId);
    const clientProgramRef = doc(
      db,
      "clients",
      newClientId,
      "programs",
      clientProgram.clientProgramId
    );
    // Update client document
    await setDoc(clientRef, {
      name: client.name,
      gender: client.gender,
      platform: client.platform,
      birthDate: client.birthDate,
      preferences: client.preferences,
      currentProgramRef: clientProgramRef,
    });

    await setDoc(
      clientProgramRef.withConverter(clientProgramConverter),
      clientProgram
    );

    await Promise.all(
      clientProgram.days.map((day, i) => {
        const dayCol = doc(
          db,
          "clients",
          newClientId,
          "programs",
          clientProgramRef.id,
          "days",
          i.toString()
        );
        return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
      })
    );
    // Add program subcollection to client document
  } catch (error) {
    console.error("Error creating client document: ", error, {
      client,
    });
    throw error;
  }
}
