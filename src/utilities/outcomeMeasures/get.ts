import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import {
  outcomeMeasureConverter,
  TOutcomeMeasure,
  TOutcomeMeasureId,
  TOutcomeMeasureWrite,
} from "../../entities/outcomeMeasure/outcomeMeasure";

export async function getAllOutcomeMeasures(): Promise<
  Record<string, TOutcomeMeasure>
> {
  try {
    // TODO: UNCOMMENT when new oms are added and live...

    // ------ temporary code

    const newOMsList = [
      // "ompq",
      // "csi",
      // "dash",
      // "fiq",
      // "visa-a",
      // "ndi",
      // "rdq",
      // "worc",
      // "spadi",
      "sf-36",
      "faam",
    ];

    const oms = await Promise.all(
      newOMsList.map(async (id) => {
        try {
          const docRef = doc(db, "outcomeMeasuresTest", id).withConverter(
            outcomeMeasureConverter
          );
          const docSnap = await getDoc(docRef);
          return docSnap.exists() ? [id, docSnap.data()] : null;
        } catch (error) {
          console.log(`Error retrieving outcome measure ${id}: `, error);
          return null;
        }
      })
    );

    console.log("oms: ", oms);

    const filteredOMs = oms.filter(
      (om): om is [string, TOutcomeMeasure] => om !== null
    );
    const validOMs = Object.fromEntries(filteredOMs);

    return validOMs;

    // ------ code end

    const outcomeMeasuresRef = collection(
      db,
      "outcomeMeasures"
    ) as CollectionReference<TOutcomeMeasureWrite>;

    const q = query(outcomeMeasuresRef, where("isConsoleLive", "==", true));

    const snapshot = await getDocs(q.withConverter(outcomeMeasureConverter));

    const outcomeMeasures = Object.fromEntries(
      snapshot.docs.map((doc) => [doc.id, doc.data()])
    );

    return outcomeMeasures;
  } catch (error) {
    console.log("Error getting outcomeMeasures: ", error);
    throw error;
  }
}

export async function getOutcomeMeasure(
  outcomeMeasureId: TOutcomeMeasureId
): Promise<TOutcomeMeasure> {
  try {
    const outcomeMeasureRef = doc(
      db,
      "outcomeMeasuresTest", // TODO: change back....
      outcomeMeasureId
    ) as DocumentReference<TOutcomeMeasureWrite>;
    const outcomeMeasureSnapshot = await getDoc(
      outcomeMeasureRef.withConverter(outcomeMeasureConverter)
    );

    const outcomeMeasureData = outcomeMeasureSnapshot.data();

    if (!outcomeMeasureData) {
      throw new Error("No outcomeMeasure found");
    }

    const outcomeMeasure = {
      ...outcomeMeasureData,
      id: outcomeMeasureSnapshot.id,
    } as TOutcomeMeasure;

    return outcomeMeasure;
  } catch (error) {
    console.log("Error getting outcomeMeasure: ", error);
    throw error;
  }
}
