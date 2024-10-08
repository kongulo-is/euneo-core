import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app } from "./init";

export const auth = getAuth(app);

if (
  process.env.EXPO_PUBLIC_USE_EMULATOR === "true" ||
  process.env.NEXT_PUBLIC_USE_EMULATOR === "true"
) {
  console.log("🔥 Connecting to Firestore emulator auth web");
  // Connect Firebase Auth to the local emulator
  connectAuthEmulator(auth, "http://localhost:9099");
}
