import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { createClinicianRef } from "../../entities/clinician/clinician";

// TODO: Add description
export async function createClinician(
  clinicianId: string,
  email: string,
  name: string
): Promise<boolean> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    await setDoc(clinicianRef, { email, name });
    return true;
  } catch (error) {
    console.error("Error creating clinician:", error, {
      clinicianId,
      email,
      name,
    });
    return false;
  }
}

export async function addFavouriteExerciseToClinician(
  clinicianId: string,
  favouriteExerciseId: string
): Promise<string[]> {
  try {
    const clinicianRef = createClinicianRef(clinicianId);

    // Use arrayUnion to add the favouriteExerciseId to the list
    await updateDoc(clinicianRef, {
      favouriteExercises: arrayUnion(favouriteExerciseId),
    });

    const updatedDoc = await getDoc(clinicianRef);

    const updatedList = updatedDoc.data()?.favouriteExercises || [];
    return updatedList;
  } catch (error) {
    console.log("Could not favourite exercise.", error);
    return [];
  }
}

export async function removeFavouriteExerciseFromClinician(
  clinicianId: string,
  favouriteExerciseId: string
): Promise<string[]> {
  try {
    const clinicianRef = createClinicianRef(clinicianId);

    // Use arrayRemove to remove the favouriteExerciseId from the list
    await updateDoc(clinicianRef, {
      favouriteExercises: arrayRemove(favouriteExerciseId),
    });
    const updatedDoc = await getDoc(clinicianRef);

    const updatedList = updatedDoc.data()?.favouriteExercises || [];

    return updatedList;
  } catch (error) {
    console.log("Could not remove favourite exercise.", error);

    return [];
  }
}
