import { deleteDoc } from "firebase/firestore";
import { createClinicianVideoRef } from "../../../entities/clinician/videos";

export async function removeVideoFromClinicain(
  assetID: string,
  clinicianId: string,
) {
  try {
    const clinicianVideoRef = createClinicianVideoRef({
      clinicians: clinicianId,
      videos: assetID,
    });

    await deleteDoc(clinicianVideoRef);

    return "Video added to clinician";
  } catch (error) {
    console.error("Error adding video to clinician", error, { clinicianId });
    throw error;
  }
}
