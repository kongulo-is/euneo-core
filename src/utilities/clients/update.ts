import { deleteField, doc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { updateDoc } from "../updateDoc";
import { updateProfile } from "firebase/auth";
import { auth } from "../../firebase/authApp";
import {
  createClientRef,
  type TClientPreferences,
  type TGender,
} from "../../entities/client/client";

export const updateClientPreference = async (
  clientId: string,
  oldPreferences: TClientPreferences,
  preferenceKey: keyof TClientPreferences,
  preferenceValue: TClientPreferences[keyof TClientPreferences]
) => {
  const clientRef = createClientRef({ clients: clientId });

  await updateDoc(clientRef, {
    preferences: {
      ...oldPreferences,
      [preferenceKey]: preferenceValue,
    },
  });
};

export async function updateClientSetup(
  clientId: string,
  name: string,
  birthDate: Date,
  gender: TGender | ""
): Promise<boolean> {
  try {
    const clientRef = createClientRef({ clients: clientId });

    await updateProfile(auth.currentUser!, {
      displayName: name,
    });

    const birthDateString = _createDateString(birthDate);

    await updateDoc(clientRef, {
      name,
      birthDate: birthDateString,
      gender: gender as TGender,
    });

    return true;
  } catch (error) {
    console.error("Error finishing client setup: ", error, {
      clientId,
    });
    return false;
  }
}

export const completeCurrentProgram = async (clientId: string) => {
  try {
    const clientRef = createClientRef({ clients: clientId });

    await updateDoc(clientRef, {
      currentClientProgramRef: deleteField(),
    });
  } catch (error) {
    console.error("Error completing current program: ", error, {
      clientId,
    });
    throw error;
  }
};

// function that creates fancy date string from date
export const _createDateString = (date: Date) => {
  const month = date.getMonth() + 1;
  const monthString = month < 10 ? `0${month}` : `${month}`;
  const day = date.getDate();
  const dayString = day < 10 ? `0${day}` : day;
  const year = date.getFullYear();
  return `${dayString}-${monthString}-${year}`;
};

export const changeCurrentProgram = async (
  clientId: string,
  programId: string
) => {
  try {
    const clientRef = createClientRef({ clients: clientId });

    const programRef = doc(db, "clients", clientId, "programs", programId);

    await updateDoc(clientRef, {
      currentClientProgramRef: programRef,
    });
    return true;
  } catch (error) {
    console.error("Error changing current program: ", error, {
      clientId,
      programId,
    });
    throw error;
  }
};
