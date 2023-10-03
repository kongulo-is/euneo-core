import { doc, updateDoc } from "firebase/firestore";
import { TClient } from "../../types/clientTypes";
import { updateProfile } from "firebase/auth";
import { auth } from "../../firebase/authApp";
import { db } from "../../firebase/db";
import { TGender } from "../../types/baseTypes";

export async function updateClientSetup(
  clientId: string,
  name: string,
  birthDate: Date,
  gender: TGender | ""
): Promise<boolean> {
  try {
    const userRef = doc(db, "clients", clientId);

    await updateProfile(auth.currentUser!, {
      displayName: name,
    });

    const birthDateString = _createDateString(birthDate);

    await updateDoc(userRef, {
      name,
      birthDate: birthDateString,
      gender,
    });

    return true;
  } catch (error) {
    console.error("Error finishing client setup: ", error, {
      clientId,
    });
    return false;
  }
}

// function that creates fancy date string from date
export const _createDateString = (date: Date) => {
  const month = date.getMonth() + 1;
  const monthString = month < 10 ? `0${month}` : `${month}`;
  const day = date.getDate();
  const dayString = day < 10 ? `0${day}` : day;
  const year = date.getFullYear();
  return `${dayString}-${monthString}-${year}`;
};
