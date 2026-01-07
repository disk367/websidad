import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCK1B0O1RO0HzYTA_ZASq6eW2kGA8Arrz4",
    authDomain: "test-df1eb.firebaseapp.com",
    databaseURL: "https://test-df1eb-default-rtdb.firebaseio.com",
    projectId: "test-df1eb",
    storageBucket: "test-df1eb.firebasestorage.app",
    messagingSenderId: "749730101238",
    appId: "1:749730101238:web:5adaa49cd2980d780079d7",
    measurementId: "G-TXX291HHVM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const db = getFirestore(app);