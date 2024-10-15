import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import {
  clinicianConverter,
  createClinicianRef,
  createSubscriptionGifts,
} from "../../entities/clinician/clinician";

/**
 * @description Creates a new clinician document
 * @param clinicianId The id of the new clinician
 * @param email The email of the new clinician
 * @param name The name of the new clinician
 * @returns A boolean indicating whether the operation was successful
 */
export async function createClinician(
  clinicianId: string,
  email: string,
  name: string
): Promise<boolean> {
  try {
    const clinicianRef = createClinicianRef(clinicianId);
    await setDoc(clinicianRef.withConverter(clinicianConverter), {
      email,
      name,
      subscriptionGifts: createSubscriptionGifts(),
    });
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
