import { increment, updateDoc } from "firebase/firestore";
import {
  createClinicianRef,
  createSubscriptionGifts,
} from "../../entities/clinician/clinician";

export async function addSubscriptionGiftsToExistingClinician(
  clinicianId: string
) {
  try {
    const clinicianRef = createClinicianRef(clinicianId);

    await updateDoc(clinicianRef, {
      subscriptionGifts: createSubscriptionGifts(),
    });

    return true;
  } catch (error) {
    console.error(
      "Error adding subscription gifts to existing clinician:",
      error
    );
    return false;
  }
}

export async function useClinicianSubscriptionGift(clinicianId: string) {
  try {
    const clinicianRef = createClinicianRef(clinicianId);

    await updateDoc(clinicianRef, {
      "subscriptionGifts.remaining": increment(-1),
    });

    return true;
  } catch (error) {
    console.error("Error decrementing subscription gifts:", error);
    return false;
  }
}
