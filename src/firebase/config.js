import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyB0Uc1Dxv965nSpcvndEsarZhTE5qedpf8",
    authDomain: "ingrdnt-9153e.firebaseapp.com",
    projectId: "ingrdnt-9153e",
    storageBucket: "ingrdnt-9153e.firebasestorage.app",
    messagingSenderId: "420871130053",
    appId: "1:420871130053:web:b96ab4e9371454d17759ac"
  };

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
