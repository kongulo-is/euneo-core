import {
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
  clinicianConverter,
  createClinicianCollectionRef,
  TClinician,
} from "../../entities/clinician/clinician";
import {
  createClinicianVideosCollectionRef,
  TClinicianVideo,
} from "../../entities/clinician/videos";
import { waitForVideoToBeProcessed } from "./videos/add";
import {
  clinicConverter,
  deserializeClinicPath,
  TClinic,
} from "../../entities/clinic/clinic";

export async function getAllClinicians(): Promise<
  (TClinician & { uid: string })[]
> {
  try {
    const cliniciansRef = createClinicianCollectionRef();

    const cliniciansDoc = await getDocs(
      cliniciansRef.withConverter(clinicianConverter)
    );

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

    const clinicianDoc = await getDoc(
      clinicianRef.withConverter(clinicianConverter)
    );

    const clinician: TClinician | undefined = clinicianDoc.data();

    if (!clinician) throw new Error("No clinician found");

    if (clinician.clinicsRef) {
      const clinics: TClinic[] = await Promise.all(
        clinician.clinicsRef.map(async (clinicRef) => {
          const clinicDoc = await getDoc(
            clinicRef.withConverter(clinicConverter)
          );
          const clinicData = clinicDoc.data();
          if (!clinicData) throw new Error("No clinic found");
          const clinicIdentifiers = deserializeClinicPath(clinicRef.path);
          return { ...clinicData, clinicRef, clinicIdentifiers };
        })
      );
      clinician.clinics = clinics;
    }

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
        const clinicianData = snapshot.docs.map((doc) => {
          let video = doc.data();
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
