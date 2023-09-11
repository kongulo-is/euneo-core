import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { initializeAuth, getAuth } from "firebase/auth";

import * as firebaseAuth from "firebase/auth";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// import * as Facebook from "expo-facebook";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC38ihxpDiZaE-S7BJfzebuPNNdBSsxdi4",
  authDomain: "euneo-a6b76.firebaseapp.com",
  projectId: "euneo-a6b76",
  storageBucket: "euneo-a6b76.appspot.com",
  messagingSenderId: "420169442406",
  appId: "1:420169442406:web:5f0e9e1c6b207fe6a5f9a7",
  measurementId: "G-5GR90C0XWB",
};

// TODO: Temporary solution is to use forced type conversion, remove this when the type is updated https://stackoverflow.com/questions/76914913/cannot-import-getreactnativepersistence-in-firebase10-1-0
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: reactNativePersistence(AsyncStorage),
});

// export const auth = getAuth(app);
export const functions = getFunctions(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
