import { DocumentReference, deleteField, doc } from "firebase/firestore";
import { TClientPreferences, TClientWrite } from "../../types/clientTypes";
import { db } from "../../firebase/db";
import { updateDoc } from "../updateDoc";
import { updateProfile } from "firebase/auth";
import { auth } from "../../firebase/authApp";
import { TGender } from "../../types/baseTypes";

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

export async function updateClientSetup(
  clientId: string,
  name: string,
  birthDate: Date,
  gender: TGender | ""
): Promise<boolean> {
  try {
    const userRef = doc(
      db,
      "clients",
      clientId
    ) as DocumentReference<TClientWrite>;

    await updateProfile(auth.currentUser!, {
      displayName: name,
    });

    const birthDateString = _createDateString(birthDate);

    await updateDoc(userRef, {
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
    const clientRef = doc(
      db,
      "clients",
      clientId
    ) as DocumentReference<TClientWrite>;

    await updateDoc(clientRef, {
      currentProgramRef: deleteField(),
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
    const clientRef = doc(
      db,
      "clients",
      clientId
    ) as DocumentReference<TClientWrite>;

    const programRef = doc(db, "clients", clientId, "programs", programId);

    await updateDoc(clientRef, {
      currentProgramRef: programRef,
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
