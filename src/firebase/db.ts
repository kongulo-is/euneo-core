import {
  connectFirestoreEmulator,
  initializeFirestore,
} from "firebase/firestore";
import { app } from "./init";

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const env = process.env.NODE_ENV;

if (env === "development") {
  console.log("Connecting to Firestore emulator");

  // Connect Firebase Auth to the local emulator
  connectFirestoreEmulator(db, "192.168.1.240", 8080);
}
