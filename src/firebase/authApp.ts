import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth } from "firebase/auth";
import * as firebaseAuth from "firebase/auth";
import { app } from "./init";

// TODO: Temporary solution is to use forced type conversion, remove this when the type is updated https://stackoverflow.com/questions/76914913/cannot-import-getreactnativepersistence-in-firebase10-1-0
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

export const auth = initializeAuth(app, {
  persistence: reactNativePersistence(AsyncStorage),
});