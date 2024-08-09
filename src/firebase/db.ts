import {
  connectFirestoreEmulator,
  initializeFirestore,
} from "firebase/firestore";
import { app } from "./init";

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const env = process.env.NODE_ENV;

console.log(
  "process.env.EXPO_PUBLIC_USE_EMULATOR",
  process.env.EXPO_PUBLIC_USE_EMULATOR,
);

if (
  env === "development" &&
  (process.env.EXPO_PUBLIC_USE_EMULATOR === "true" ||
    process.env.NEXT_PUBLIC_USE_EMULATOR === "true")
) {
  console.log("Connecting to Firestore emulator");

  // Connect Firebase Auth to the local emulator
  connectFirestoreEmulator(db, "localhost", 8080);
}
