import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/db";

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
