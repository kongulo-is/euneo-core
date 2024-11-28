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
      "outcomeMeasures",
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
