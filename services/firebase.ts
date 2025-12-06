import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithRedirect, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, writeBatch, collection, getDocs } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getAnalytics } from 'firebase/analytics';

// TODO: Replace with your app's Firebase project configuration
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "bounce-5e606.firebaseapp.com",
  projectId: "bounce-5e606",
  storageBucket: "bounce-5e606.firebasestorage.app",
  messagingSenderId: "912074925338",
  appId: "1:912074925338:web:ec05c74853f01e6e4978a3",
  measurementId: "G-WKPVXNX6QM"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

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
  // For Android, we need the package name
  android: {
    packageName: 'com.bounce.app',
    installApp: false,
  },
  // For iOS (if you add it later)
  iOS: {
    bundleId: 'com.bounce.app',
  },
  // Use dynamic link domain if you have one
  dynamicLinkDomain: undefined,
});

// For native, use Firebase hosting URL (not custom scheme)
// Firebase will handle opening the app via Android App Links
const nativeRedirectUrl = 'https://bounce-5e606.firebaseapp.com';

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