import {
  connectFirestoreEmulator,
  initializeFirestore,
} from "firebase/firestore";
import { app } from "./init";

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// console.log(
//   "process.env.NEXT_PUBLIC_EMULATOR",
//   process.env.NEXT_PUBLIC_EMULATOR
// );

// if (process.env.NEXT_PUBLIC_EMULATOR) {
//   // Connect Firebase Auth to the local emulator
//   console.log("Connecting to Firestore emulator");

//   connectFirestoreEmulator(db, "localhost", 8080);
// }
