import { setDoc } from "firebase/firestore";
import {
  createClinicianVideoRef,
  TClinicianVideo,
} from "../../../entities/clinician/videos";

export async function addVideoToClinician(
  asset: TClinicianVideo,
  clinicianId: string,
) {
  try {
    // add it to the clinician's video pool subcollection

    const clinicianVideoRef = createClinicianVideoRef({
      clinicians: clinicianId,
      videos: asset.assetID,
    });

    await setDoc(clinicianVideoRef, asset);

    return "Video added to clinician";
  } catch (error) {
    console.error("Error adding video to clinician", error, { clinicianId });
    throw error;
  }
}
