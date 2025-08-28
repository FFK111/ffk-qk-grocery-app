import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch 
} from "firebase/firestore";
import type { GroceryItem } from "./types";

// Firebase config for your project
const firebaseConfig = {
  apiKey: "AIzaSyD5XMfEYTKOEUMomtD4Wdqf88OjrCJtsBE",
  authDomain: "ffk-grocery-sync.firebaseapp.com",
  projectId: "ffk-grocery-sync",
  storageBucket: "ffk-grocery-sync.appspot.com",
  messagingSenderId: "442396361973",
  appId: "1:442396361973:web:69ec493017e0373e5ff1bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsCollectionRef = collection(db, "items");

// Fetch grocery items from Firestore
export const fetchItems = async (): Promise<GroceryItem[]> => {
  try {
    const querySnapshot = await getDocs(itemsCollectionRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GroceryItem[];
  } catch (error) {
    console.error("Error fetching items from Firestore:", error);
    // Return an empty array or handle the error as appropriate for your app
    return [];
  }
};

// Add a new grocery item to Firestore
export const addItemToFirestore = async (item: GroceryItem): Promise<void> => {
  try {
    // Use the item's own id property to create the document reference
    const itemDocRef = doc(db, "items", item.id);
    await setDoc(itemDocRef, item);
  } catch (error) {
    console.error("Error adding item to Firestore:", error);
    throw error;
  }
};

// Delete all items from Firestore
export const deleteAllItemsFromFirestore = async (): Promise<void> => {
  try {
    const querySnapshot = await getDocs(itemsCollectionRef);
    if (querySnapshot.empty) {
        return; // Nothing to delete
    }
    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error deleting all items:", error);
    throw error;
  }
};
