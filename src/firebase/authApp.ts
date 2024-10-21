// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectAuthEmulator, initializeAuth } from "firebase/auth";
import * as firebaseAuth from "firebase/auth";
import { app } from "./init";

// TODO: Temporary solution is to use forced type conversion, remove this when the type is updated https://stackoverflow.com/questions/76914913/cannot-import-getreactnativepersistence-in-firebase10-1-0
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

export const auth = initializeAuth(app, {
  persistence: reactNativePersistence(AsyncStorage),
});

const env = process.env.NODE_ENV;

if (
  env === "development" &&
  (process.env.EXPO_PUBLIC_USE_EMULATOR === "true" ||
    process.env.NEXT_PUBLIC_USE_EMULATOR === "true")
) {
  console.log("🔥 Connecting to Firestore emulator auth app");

  // Connect Firebase Auth to the local emulator
  connectAuthEmulator(auth, "http://192.168.1.49:9099");
}
