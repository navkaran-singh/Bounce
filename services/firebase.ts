import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithRedirect, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, writeBatch, collection, getDocs } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB77G4YH_22Gj3f_3gBFErEFWWWhzGB_8Q",
  authDomain: "bounce-5e606.firebaseapp.com",
  projectId: "bounce-5e606",
  storageBucket: "bounce-5e606.firebasestorage.app",
  messagingSenderId: "912074925338",
  appId: "1:912074925338:web:ec05c74853f01e6e4978a3",
  measurementId: "G-WKPVXNX6QM"
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
  collection,
  getDocs,
  actionCodeSettings,
  nativeRedirectUrl
};
export type { User };