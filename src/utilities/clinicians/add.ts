import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/db";

export async function createClinician(
  cliniciansId: string,
  email: string,
  name: string
): Promise<boolean> {
  try {
    const clinicianRef = doc(db, "clinicians", cliniciansId);
    await setDoc(clinicianRef, { email, name });
    return true;
  } catch (error) {
    console.error("Error creating clinician:", error, {
      cliniciansId,
      email,
      name,
    });
    return false;
  }
}
