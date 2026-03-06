import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, update } from "firebase/database";
import { getAuth } from "firebase/auth";

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is properly configured
const isFirebaseConfigured = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("❌ Échec de l'initialisation Firebase:", error);
  }
} else {
  console.warn("⚠️ Firebase n'est pas configuré. Les clés VITE_FIREBASE_PROJECT_ID ou VITE_FIREBASE_API_KEY sont manquantes dans les variables d'environnement.");
}

// Null-safe wrappers for Firebase functions
const safeRef = (database: any, path: string) => {
  if (!database) return null;
  return ref(database, path);
};

const safeOnValue = (query: any, callback: any) => {
  if (!query) return () => {};
  return onValue(query, callback);
};

const safePush = (parent: any, value?: any) => {
  if (!parent) return { key: Math.random().toString(36).substr(2, 9) };
  return push(parent, value);
};

const safeSet = (reference: any, value: any) => {
  if (!reference) return Promise.resolve();
  return set(reference, value);
};

const safeUpdate = (reference: any, values: any) => {
  if (!reference) return Promise.resolve();
  return update(reference, values);
};

export { 
  db, 
  auth, 
  safeRef as ref, 
  safeOnValue as onValue, 
  safePush as push, 
  safeSet as set, 
  safeUpdate as update 
};
