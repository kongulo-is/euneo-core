import { initializeFirestore } from "firebase/firestore";
import { app } from "./init";

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
