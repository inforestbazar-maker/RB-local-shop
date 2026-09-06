// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore, setLogLevel } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

try {
  setLogLevel("silent");
} catch (e) {
  // ignore
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAH8jX0h86EHiX0wYhPZhqwOst9nMKmjCs",
  authDomain: "vendor-8ea02.firebaseapp.com",
  projectId: "vendor-8ea02",
  storageBucket: "vendor-8ea02.firebasestorage.app",
  messagingSenderId: "970317174026",
  appId: "1:970317174026:web:7fc294f2b881b46f0a16f3",
  measurementId: "G-R81F5JP6T0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore safely
let firestoreInstance: any = null;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true
  });
} catch (e) {
  console.warn("Firestore client initialization notice:", e);
}

export const db = firestoreInstance;

// Initialize Analytics safely in browser
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics not supported in this environment:", err);
  });
}

