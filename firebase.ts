import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import type { GroceryItem } from "./types";

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

// ✅ Fetch grocery items from Firestore
export const fetchItems = async (): Promise<GroceryItem[]> => {
  const snapshot = await getDocs(collection(db, "items"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GroceryItem[];
};

// ✅ Add a new grocery item to Firestore
export const addItemToFirestore = async (item: GroceryItem): Promise<void> => {
  try {
    await setDoc(doc(db, "items", item.id), item);
  } catch (error) {
    console.error("Error adding item to Firestore:", error);
  }
};

// ✅ Update purchased status of an item
export const updateItemPurchasedStatus = async (
  itemId: string,
  purchased: boolean
): Promise<void> => {
  try {
    await updateDoc(doc(db, "items", itemId), { purchased });
  } catch (error) {
    console.error("Error updating item status:", error);
  }
};

// ✅ (Optional) Delete an item from Firestore
export const deleteItemFromFirestore = async (itemId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "items", itemId));
  } catch (error) {
    console.error("Error deleting item:", error);
  }
};

// ✅ (Optional) Real-time listener for grocery items
export const listenToItems = (callback: (items: GroceryItem[]) => void) => {
  return onSnapshot(collection(db, "items"), snapshot => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GroceryItem[];
    callback(items);
  });
};
