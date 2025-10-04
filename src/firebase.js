import { initializeApp } from "firebase/app";
// Make sure sendPasswordResetEmail is included in the import from firebase/auth
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"; // Keep this for future use if you want

const firebaseConfig = {
  apiKey: "AIzaSyDrZd5QDsIuVIW4ME3rCNiPVeYC0HNlnWE",
  authDomain: "scheduplan-1b51d.firebaseapp.com",
  projectId: "scheduplan-1b51d",
  storageBucket: "scheduplan-1b51d.firebasestorage.app",
  messagingSenderId: "327190164183",
  appId: "1:327190164183:web:b1410de06ec219ba037692",
  measurementId: "G-N7V5W8J5C0"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// Export the functions to be used in other files
export { httpsCallable, functions, signInWithPopup, sendPasswordResetEmail };