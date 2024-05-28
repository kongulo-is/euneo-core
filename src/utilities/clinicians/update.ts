import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClinician } from "../../types/clinicianTypes";
import { updateDoc } from "../updateDoc";

export async function addVideoToClinician(
  asset: {
    displayID: string;
    assetID: string;
  },
  clinicianId: string
) {
  try {
    // add it to the clinician's video pool subcollection

    const videoPoolSubCollectionRef = doc(
      db,
      "clinicians",
      clinicianId,
      "videoPool",
      asset.assetID
    );

    await setDoc(videoPoolSubCollectionRef, asset);

    return "Video added to clinician";
  } catch (error) {
    console.error("Error adding video to clinician", error, { clinicianId });
    throw error;
  }
}

export async function removeVideoFromClinicain(
  asset: {
    displayID: string;
    assetID: string;
  },
  clinicianId: string
) {
  try {
    await deleteDoc(
      doc(db, "clinicians", clinicianId, "videoPool", asset.assetID)
    );

    return "Video added to clinician";
  } catch (error) {
    console.error("Error adding video to clinician", error, { clinicianId });
    throw error;
  }
}
