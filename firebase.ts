// firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ✅ Firebase config for your project
const firebaseConfig = {
  apiKey: "AIzaSyD5XMfEYTKOEUMomtD4Wdqf88OjrCJtsBE",
  authDomain: "ffk-grocery-sync.firebaseapp.com",
  projectId: "ffk-grocery-sync",
  storageBucket: "ffk-grocery-sync.appspot.com",
  messagingSenderId: "442396361973",
  appId: "1:442396361973:web:69ec493017e0373e5ff1bc"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Firestore instance
export const db = getFirestore(app);

// ✅ Function to fetch grocery items from Firestore
export const fetchItems = async () => {
  const snapshot = await getDocs(collection(db, "items"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

