import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app } from "./init";

export const auth = getAuth(app);

// if (process.env.NEXT_PUBLIC_EMULATOR) {
//   // Connect Firebase Auth to the local emulator
//   connectAuthEmulator(auth, "http://localhost:9099");
// }
