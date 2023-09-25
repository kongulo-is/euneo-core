import { collection, CollectionReference, getDocs } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TOutcomeMeasure, TOutcomeMeasureWrite } from "../../types/baseTypes";
import { outcomeMeasureConverter } from "../converters";

export async function getAllOutcomeMeasures(): Promise<
  Record<string, TOutcomeMeasure>
> {
  try {
    const outcomeMeasuresRef = collection(
      db,
      "outcomeMeasures"
    ) as CollectionReference<TOutcomeMeasureWrite>;
    const outcomeMeasuresSnapshot = await getDocs(
      outcomeMeasuresRef.withConverter(outcomeMeasureConverter)
    );
    const outcomeMeasures = Object.fromEntries(
      outcomeMeasuresSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );

    return outcomeMeasures;
  } catch (error) {
    console.log("Error getting outcomeMeasures: ", error);
    throw error;
  }
}
