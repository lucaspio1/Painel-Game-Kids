import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <-- Adicione esta linha


const firebaseConfig = {
  apiKey: "AIzaSyBubAbymU1HWgZF9-e7npEZQhI-rBwSm34",
  authDomain: "gamekids-b8041.firebaseapp.com",
  projectId: "gamekids-b8041",
  storageBucket: "gamekids-b8041.firebasestorage.app",
  messagingSenderId: "210136184481",
  appId: "1:210136184481:web:a0cedcc8a9f9a85422a2e0",
  measurementId: "G-0RSM74JMFX"
};



const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); // <-- Exporte o Auth