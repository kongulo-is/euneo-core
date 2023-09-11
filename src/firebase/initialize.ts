import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import * as firebaseAuth from "firebase/auth";
import { getFunctions } from "firebase/functions";

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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// export const auth = getAuth(app);
export const functions = getFunctions(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
