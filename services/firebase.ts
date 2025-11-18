
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your project's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyA27H2M8funzipx6J4z0wVfc70zXFSSWRU",
  authDomain: "the-smart-lawyer-c54fa.firebaseapp.com",
  databaseURL: "https://the-smart-lawyer-c54fa-default-rtdb.firebaseio.com",
  projectId: "the-smart-lawyer-c54fa",
  storageBucket: "the-smart-lawyer-c54fa.appspot.com",
  messagingSenderId: "604114667184",
  appId: "1:604114667184:web:a97d129650a8b32d159d75",
  measurementId: "G-WC8H4GEYM6"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
// Explicitly set the region for Cloud Functions. This is often necessary for extensions.
// 'us-central1' is specified to match the deployed function's location.
const functions: Functions = getFunctions(app, 'us-central1');
const storage: FirebaseStorage = getStorage(app);

// This variable is checked by other parts of the app to confirm configuration.
export const isFirebaseConfigured = true;

export { app, auth, db, functions, storage };
export default app;
