import { DocumentReference, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/db";

import { updateDoc } from "../updateDoc";
import {
  clientConverter,
  TClient,
  TClientPreferences,
  TClientRead,
  TClientWrite,
} from "../../entities/client/client";
import { TClientProgram } from "../../entities/client/clientProgram";

/**
 * @description This function adds client preferences to the client document.
 * Used in app
 */
export const addClientPreferences = async (
  clientId: string,
  preferences: TClientPreferences
) => {
  // TODO: move this out of here and take it as a parameter (also create a ref creator function for client)
  const clientRef: DocumentReference<TClientRead, TClientWrite> = doc(
    db,
    "clients",
    clientId
  ).withConverter(clientConverter);

  await updateDoc(clientRef, {
    preferences,
  });
};

/**
 * @description Used in app //TODO: add description
 */
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

/**
 * @description Used in app //TODO: add description,  not used?
 */
// export async function createDuplicateDocument(
//   newClientId: string,
//   client: TClient,
//   clientProgram: TClientProgram,
// ) {
//   try {
//     const clientRef = doc(db, "clients", newClientId);
//     const clientProgramRef = doc(
//       db,
//       "clients",
//       newClientId,
//       "programs",
//       clientProgram.clientProgramId,
//     );
//     // Update client document
//     await setDoc(clientRef, {
//       name: client.name,
//       gender: client.gender,
//       platform: client.platform,
//       birthDate: client.birthDate,
//       preferences: client.preferences,
//       currentProgramRef: clientProgramRef,
//     });

//     await setDoc(
//       clientProgramRef.withConverter(clientProgramConverter),
//       clientProgram,
//     );

//     await Promise.all(
//       clientProgram.days.map((day, i) => {
//         const dayCol = doc(
//           db,
//           "clients",
//           newClientId,
//           "programs",
//           clientProgramRef.id,
//           "days",
//           i.toString(),
//         );
//         return setDoc(dayCol.withConverter(clientProgramDayConverter), day);
//       }),
//     );
//     // Add program subcollection to client document
//   } catch (error) {
//     console.error("Error creating client document: ", error, {
//       client,
//     });
//     throw error;
//   }
// }
