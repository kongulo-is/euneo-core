import {
  collection,
  CollectionReference,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClinician } from "../../types/clinicianTypes";
import { ClinicianWrite } from "../../types/converterTypes";

export async function getAllClinicians(): Promise<
  (TClinician & { uid: string })[]
> {
  try {
    const cliniciansRef = collection(
      db,
      "clinicians"
    ) as CollectionReference<TClinician>;

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
    const cliniciansRef = collection(
      db,
      "clinicians"
    ) as CollectionReference<TClinician>;

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
  callback: (videos: { assetID: string; displayID: string }[]) => Promise<void>
): Promise<Unsubscribe> {
  const videoPoolCollectionRef = collection(
    db,
    "clinicians",
    clinicianId,
    "videoPool"
  ) as CollectionReference<{ assetID: string; displayID: string }>;

  const unsubscribe = onSnapshot(
    videoPoolCollectionRef,
    async (snapshot: QuerySnapshot<{ assetID: string; displayID: string }>) => {
      if (!snapshot.empty) {
        const clinicianData = snapshot.docs.map((doc) => doc.data());
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
