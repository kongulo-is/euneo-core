import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/db";

type TConfig = {
  forceUpdate: string; // version number
  optionalUpdate: string; // version number
};

export async function getConfig(): Promise<TConfig> {
  // collection: remote, docId: config
  const config = await getDoc(doc(db, "remote", "config"));
  return config.data() as TConfig;
}
