import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import {
  createClinicianCollectionRef,
  TClinician,
} from "../../entities/clinician/clinician";
import {
  createClinicianVideosCollectionRef,
  TClinicianVideo,
} from "../../entities/clinician/videos";
import { addVideoToClinician, waitForVideoToBeProcessed } from "./videos/add";

export async function getAllClinicians(): Promise<
  (TClinician & { uid: string })[]
> {
  try {
    // TODO: create a converter
    const cliniciansRef = createClinicianCollectionRef();

    const cliniciansDoc = await getDocs(cliniciansRef);

    const clinicians = cliniciansDoc.docs.map((clinician) => ({
      uid: clinician.id,
      ...clinician.data(),
    }));

    return clinicians;
  } catch (error) {
    console.error("Error fetching clinicians", error);
    throw error;
  }
}

export async function getAllCliniciansIds(): Promise<string[]> {
  try {
    const cliniciansRef = createClinicianCollectionRef();

    const cliniciansDoc = await getDocs(cliniciansRef);

    const clinicians = cliniciansDoc.docs.map((clinician) => clinician.id);

    return clinicians;
  } catch (error) {
    console.error("Error fetching clinicians", error);
    throw error;
  }
}

export async function getClinician(clinicianId: string): Promise<TClinician> {
  try {
    const clinicianRef = doc(
      db,
      "clinicians",
      clinicianId
    ) as DocumentReference<TClinician>;

    const clinicianDoc = await getDoc(clinicianRef);

    const clinician = clinicianDoc.data();

    if (!clinician) throw new Error("No clinician found");

    return clinician;
  } catch (error) {
    console.error("Error fetching clinician", error, { clinicianId });
    throw error;
  }
}

export async function clinicianVideoPoolListener(
  clinicianId: string,
  callback: (videos: TClinicianVideo[]) => Promise<void>
): Promise<Unsubscribe> {
  const videoPoolCollectionRef =
    createClinicianVideosCollectionRef(clinicianId);

  const unsubscribe = onSnapshot(
    videoPoolCollectionRef,
    async (snapshot: QuerySnapshot<TClinicianVideo>) => {
      if (!snapshot.empty) {
        console.log("SNAPCHANGE");

        const clinicianData = snapshot.docs.map((doc) => {
          let video = doc.data();
          console.log("video", video);

          if (!video.displayID) {
            // video is still processing
            // try to get the displayID
            waitForVideoToBeProcessed(video, clinicianId);
          }
          return video;
        });

        // Collection has documents, call the callback to handle the data

        await callback(clinicianData);
      } else {
        // Collection is empty, call the callback with an empty array
        await callback([]);
      }
    }
  );

  return unsubscribe;
}

export async function checkIfClinicianExists(
  clinicianId: string
): Promise<boolean> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);

    const clinicianDoc = await getDoc(clinicianRef);

    return clinicianDoc.exists();
  } catch (error) {
    console.error("Error fetching clinician", error, { clinicianId });
    throw error;
  }
}
