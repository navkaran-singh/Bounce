import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithRedirect, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getAnalytics } from 'firebase/analytics';

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const perf = getPerformance(app);
const analytics = getAnalytics(app);

const googleProvider = new GoogleAuthProvider();

const actionCodeSettings = (redirectUrl?: string) => ({
    url: redirectUrl || window.location.origin,
    handleCodeInApp: true,
});

const nativeRedirectUrl = 'com.bounce.app://login-callback';

export {
  app,
  auth,
  db,
  googleProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithRedirect,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
  actionCodeSettings,
  nativeRedirectUrl
};
export type { User };